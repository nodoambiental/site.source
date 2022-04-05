import { Nodes } from "./actions";
import type { DirectlyEditableHTMLProps } from "./types";
import {
    map,
    fromEvent,
    Observable,
    BehaviorSubject,
    Subject,
    Subscription,
    Observer,
    startWith,
    OperatorFunction,
} from "rxjs";
import { HasEventTargetAddRemove } from "rxjs/internal/observable/fromEvent";
import short from "short-uuid";

export class EditableNode<
    EditableHTMLProp extends HTMLElement[DirectlyEditableHTMLProps]
> {
    constructor(
        public readonly initialState: EditableHTMLProp,
        public id: string
    ) {
        this.initialState = initialState;
        this._state = new BehaviorSubject<EditableHTMLProp>(initialState);
    }

    private _subscriptions: Record<string, Subscription>;

    private _state: BehaviorSubject<EditableHTMLProp>;

    private _transforms: Record<
        string,
        (data: EditableHTMLProp) => EditableHTMLProp
    >;

    private _setDirectPropertyObserver(
        nodeProperty: DirectlyEditableHTMLProps,
        transform: (data: EditableHTMLProp) => EditableHTMLProp = (data) =>
            data,
        onError?: Observer<EditableHTMLProp>["error"],
        onLifecycle?: Observer<EditableHTMLProp>["complete"]
    ): void {
        this._subscriptions[nodeProperty] = this._state.subscribe({
            next: (data) => {
                Object.defineProperty(
                    document.getElementById(this.id),
                    nodeProperty,
                    {
                        value: transform(data),
                    }
                );
            },
            error: onError ? onError : () => {},
            complete: onLifecycle ? onLifecycle : () => {},
        });
    }

    private _unsetDirectPropertyObserver(
        nodeProperty: DirectlyEditableHTMLProps
    ): void {
        if (!this._subscriptions[nodeProperty]) {
            return;
        }
        this._subscriptions[nodeProperty].unsubscribe();
        return;
    }

    public setProperty(
        property: DirectlyEditableHTMLProps,
        transform?: (data: EditableHTMLProp) => EditableHTMLProp,
        onError?: Observer<EditableHTMLProp>["error"],
        onLifecycle?: Observer<EditableHTMLProp>["complete"]
    ): void {
        this._transforms[property] = transform;
        this._setDirectPropertyObserver(
            property,
            transform,
            onError,
            onLifecycle
        );
    }

    public unsetProperty(property: DirectlyEditableHTMLProps): void {
        this._unsetDirectPropertyObserver(property);
    }

    public update(value: EditableHTMLProp): void {
        this._state.next(value);
    }

    public sideEffect(
        observer: Partial<Observer<EditableHTMLProp>>
    ): Subscription {
        return this._state.subscribe(observer);
    }
}

export class State<Data> {
    constructor(public readonly initialState: Data) {
        this.initialState = initialState;
        this._state = new BehaviorSubject<Data>(initialState);
    }

    public subscription: Subscription;

    private _state: BehaviorSubject<Data>;

    public update(value: Data): void {
        this._state.next(value);
    }

    public subscribe(observer: Partial<Observer<Data>>): Subscription {
        return this._state.subscribe(observer);
    }
}

export class Node<StateData> {
    constructor(
        private id: string,
        initialState?: StateData,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"],
        isComponent?: boolean
    ) {
        // TODO handle the state initialization
        this._isComponent = isComponent ?? false;
        if (this._isComponent) {
            this._nodeElement = () =>
                document.querySelector(`[data-mag-id="${id}"]`);
        } else {
            this._nodeElement = () => document.getElementById(id);
        }
        this._node = new BehaviorSubject(this._nodeElement());
        this._nodeSubscription = this._node.subscribe({
            next: (node) => {
                this._nodeElement().replaceWith(node);
            },
            error: onError ? onError : () => {},
            complete: onLifecycle ? onLifecycle : () => {},
        });
        this._action = new BehaviorSubject({ id: "", payload: "" });
        this._actions = {};
        this._actionSubscriptions = {};

        const defaultActionKeys: (keyof typeof Nodes)[] = Object.keys(
            Nodes
        ) as unknown as (keyof typeof Nodes)[];
        defaultActionKeys.forEach((actionKey) => {
            this.addAction(actionKey, Nodes[actionKey]);
        });
    }

    private _isComponent: boolean;

    private _nodeElement: () => HTMLElement;

    private _nodeSubscription: Subscription;

    private _actionSubscriptions: Record<string, Subscription>;

    private _node: BehaviorSubject<HTMLElement>;

    private _action: BehaviorSubject<{ id: string; payload?: unknown }>;

    private _actions: Record<
        string,
        (node: HTMLElement, payload?: unknown) => HTMLElement
    >;

    private _state: State<StateData>;

    // TODO add return type SharedState
    get state() {
        // TODO update to actually use the State
        return this._state;
    }

    set state(data) {
        throw new Error("State is readonly. Use the methods to modify it.");
    }

    public addAction(
        actionId: string,
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        this._actions[actionId] = action;
        this._actionSubscriptions[actionId] = this._action.subscribe({
            next: (data) => {
                if (data.id === actionId) {
                    this._node.next(action(this._nodeElement(), data.payload));
                }
                return data;
            },
            error: onError,
            complete: onLifecycle,
        });
    }

    public removeAction(actionId: string) {
        this._actionSubscriptions[actionId].unsubscribe();
        delete this._actions[actionId];
    }

    public fireAction(actionId: string, payload?: unknown) {
        this._action.next({ id: actionId, payload: payload });
    }

    public get actionsList() {
        return Object.keys(this._actions);
    }

    public sideEffect(observer: Partial<Observer<HTMLElement>>): Subscription {
        return this._node.subscribe(observer);
    }

    // TODO add return types
    public setState(state: typeof this._state) {
        // TODO update to actually use the State
        //this._state = state;
    }

    // TODO add return types
    public transformState(
        transform: (state: typeof this.state) => typeof this._state
    ) {
        // TODO update to actually use the State
        //this._state = transform(this._state);
    }
}

// TODO maybe not use a class name and instead use some data attributes

export class ComponentTemplate<StateData> {
    constructor(
        private className: string,
        initialState?: StateData,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"]
    ) {
        this.ids = [];
        this._elements = {};
        Array.from(
            // Might look hacky to select by class instead of attribute but makes
            // bolting the component to elements much much easier and cleaner
            document.getElementsByClassName(
                className
            ) as HTMLCollectionOf<HTMLElement>
        ).forEach((element) => {
            const newId = short.generate();
            const doesExist = () => {
                const node = document.querySelector(`[data-mag-id="${newId}"]`);
                return !!node;
            };
            if (!doesExist()) {
                element.dataset.magId = newId;
            }
            this.ids.push(newId);
            this._elements[newId] = new Node(
                newId,
                initialState,
                onError,
                onLifecycle,
                true
            );
        });
    }

    // TODO Add method to check if there are new elements with the class name and regenerate them

    private _elements: Record<string, Node<StateData>>;

    public ids: string[];

    public addAction(
        actionId: string,
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        this.ids.forEach((id) => {
            this._elements[id].addAction(
                actionId,
                action,
                onError,
                onLifecycle
            );
        });
    }

    public removeAction(actionId: string) {
        this.ids.forEach((id) => {
            this._elements[id].removeAction(actionId);
        });
    }

    public fireAction(actionId: string, payload?: unknown) {
        this.ids.forEach((id) => {
            this._elements[id].fireAction(actionId, payload);
        });
    }

    public get actionsList() {
        return this._elements[this.ids[0]].actionsList;
    }

    public sideEffect(
        observer: Partial<Observer<HTMLElement>>
    ): Subscription[] {
        const subs: Subscription[] = [];
        this.ids.forEach((id) => {
            subs.push(this._elements[id].sideEffect(observer));
        });
        return subs;
    }

    // TODO add return types
    public getLocalState(id: string) {
        // TODO handle using State
        //return this._elements[id].state;
    }

    // TODO add method to set the local state

    // TODO add method to transform the local state
}

export class Component<LocalState, SharedState> {
    constructor(
        name: string,
        initialState?: LocalState,
        initalSharedStaet?: SharedState,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"]
    ) {
        // TODO Handle SharedState initialization
        this._name = `mag-${name}`;
        this._components = new ComponentTemplate(
            this._name,
            initialState,
            onError,
            onLifecycle
        );
    }

    private _name: string;

    private _components: ComponentTemplate<LocalState>;

    private _sharedState: State<SharedState>;

    // TODO add return type SharedState
    get sharedState() {
        // TODO update to actually use the State
        return this._sharedState;
    }

    set sharedState(data) {
        throw new Error(
            "Shared state is readonly. Use the methods to modify it."
        );
    }

    // TODO add return types
    public setSharedState(state: typeof this._sharedState) {
        // TODO update to actually use the State
        //this._sharedState = state;
    }

    // TODO add return types
    public transformSharedState(
        transform: (state: typeof this.sharedState) => typeof this._sharedState
    ) {
        // TODO update to actually use the State
        //this._sharedState = transform(this._sharedState);
    }

    // TODO populate the regenerate method on the component definition
    // public regenerate(): void {
    //     this._components = new ComponentTemplate(
    //         `mag-${this._name}`,
    //         onError,
    //         onLifecycle
    //     );
    // }

    // ? maybe custom implementation? it's pointless now so far
    public onLoad(
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        this._components.addAction("onLoad", action);
        fromEvent(window, "load").subscribe({
            next: () => {
                this._components.fireAction("onLoad");
            },
            error: onError,
            complete: onLifecycle,
        });
    }

    public onUpdate(
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        this._components.addAction("onUpdate", action);
        this._components.sideEffect({
            next: () => {
                this._components.fireAction("onUpdate");
            },
            error: onError,
            complete: onLifecycle,
        });
    }

    // FIXME for some reason the event stuff is not working
    public onEventGlobal(
        event: string,
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        console.info(
            `Added global event listener to component ${this._name} for "${event}"`
        );

        this._components.addAction(`on${event}`, action);
        fromEvent(window, event).subscribe({
            next: (event) => {
                console.info(
                    `Received global event "${event.type}" on component "${this._name}"`
                );
                this._components.fireAction(`on${event}`, event);
            },
            error: onError,
            complete: onLifecycle,
        });
    }

    // TODO add way to handle the local state of each element
    public onEventLocal(
        event: string,
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        console.info(
            `Added local event listener to component ${this._name} for "${event}"`
        );

        this._components.addAction(`on${event}`, action);

        this._components.ids.forEach((elementId) => {
            fromEvent(
                document.querySelector(`[data-mag-id="${elementId}"]`),
                event
            ).subscribe({
                next: (event) => {
                    console.info(
                        `Received local event "${event.type}" on component "${this._name}" with id "${elementId}"`
                    );
                    this._components.fireAction(`on${event}`, event);
                },
                error: onError,
                complete: onLifecycle,
            });
        });
    }
}

export class Stream<Data> {
    constructor() {
        this._state = new Subject<Data>();
    }

    protected _state: Subject<Data>;

    public subscribe(
        transform: (data: unknown) => Data,
        observer: Observer<Data>
    ): Subscription {
        return this._state.pipe(map(transform)).subscribe(observer);
    }

    public add(value: Data): void {
        this._state.next(value);
    }
}

// fixme i actually no longer understand this, review
export class ActiveEvent<EventData> {
    constructor(
        event: string,
        mapFunction: (event: Event, data?: unknown) => EventData
    ) {
        const source = fromEvent(window, event);
        this._stream = source.pipe(map(mapFunction));
    }

    protected _stream: Observable<EventData>;

    protected _subscriptions: Record<string, Subscription>;

    public subscribe(id: string, observer: Partial<Observer<EventData>>): void {
        this._subscriptions[id] = this._stream.subscribe(observer);
    }

    public unsubscribe(id: string): void {
        this._subscriptions[id].unsubscribe();
    }
}

export class ActiveCustomEvent<
    EventData,
    EventImplementation extends Event,
    Target extends
        | HasEventTargetAddRemove<EventImplementation>
        | ArrayLike<HasEventTargetAddRemove<EventImplementation>>
> {
    constructor(
        event: string,
        target: Target,
        mapFunction: (value: Target, data?: unknown) => EventData,
        middleware?: OperatorFunction<
            EventImplementation | Target,
            EventImplementation | Target
        >
    ) {
        const source = fromEvent(target, event);
        this._stream = source.pipe(middleware, map(mapFunction));
    }

    protected _stream: Observable<EventData>;

    protected _subscriptions: Record<string, Subscription>;

    public subscribe(id: string, observer: Partial<Observer<EventData>>): void {
        this._subscriptions[id] = this._stream.subscribe(observer);
    }

    public unsubscribe(id: string): void {
        this._subscriptions[id].unsubscribe();
    }
}
export class MediaQuery {
    constructor(query: string) {
        this._query = query;
        const mediaQuery = window.matchMedia(query);
        this._stream = fromEvent(mediaQuery, "change").pipe(
            startWith(mediaQuery),
            map((list: MediaQueryList) => list.matches)
        );
    }

    protected _query;

    protected _stream: Observable<boolean>;

    protected _subscriptions: Record<string, Subscription> = {};

    public subscribe(
        subscriptionId: string,
        observer: Partial<Observer<boolean>>
    ): void {
        this._subscriptions[subscriptionId] = this._stream.subscribe(observer);
    }

    public unsubscribe(id: string): void {
        this._subscriptions[id].unsubscribe();
    }
}

export class WidthQuery extends MediaQuery {
    constructor(max?: number, min?: number) {
        const query = max
            ? min
                ? `(max-width: ${max}px) and (min-width: ${min}px)`
                : `(max-width: ${max}px)`
            : min
            ? `(min-width: ${min}px)`
            : "";

        super(query);
    }
}

// TODO fix the typings of window and shit
// TODO clean, fix and extend this properly
// TODO make a more decent startup script
