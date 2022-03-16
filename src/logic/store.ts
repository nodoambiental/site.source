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
import { v4 as uuid } from "uuid";

export class ReactiveEditableNode<
    T extends HTMLElement[DirectlyEditableHTMLProps]
> {
    constructor(public readonly initialState: T, public id: string) {
        this.initialState = initialState;
        this._state = new BehaviorSubject<T>(initialState);
    }

    private _subscriptions: Record<string, Subscription>;

    private _state: BehaviorSubject<T>;

    private _transforms: Record<string, (data: T) => T>;

    private _setDirectPropertyObserver(
        nodeProperty: DirectlyEditableHTMLProps,
        transform: (data: T) => T = (data) => data,
        onError?: Observer<T>["error"],
        onLifecycle?: Observer<T>["complete"]
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
        transform?: (data: T) => T,
        onError?: Observer<T>["error"],
        onLifecycle?: Observer<T>["complete"]
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

    public update(value: T): void {
        this._state.next(value);
    }

    public sideEffect(observer: Partial<Observer<T>>): Subscription {
        return this._state.subscribe(observer);
    }
}

export class ReactiveNode {
    constructor(
        private id: string,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"]
    ) {
        this._nodeElement = () => document.getElementById(id);
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

    private _nodeElement: () => HTMLElement;

    private _nodeSubscription: Subscription;

    private _actionSubscriptions: Record<string, Subscription>;

    private _node: BehaviorSubject<HTMLElement>;

    private _action: BehaviorSubject<{ id: string; payload?: unknown }>;

    private _actions: Record<
        string,
        (node: HTMLElement, payload?: unknown) => HTMLElement
    >;

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
}

// TODO maybe not use a class name and instead use some data attributes

export class ComponentTemplate {
    constructor(
        private className: string,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"]
    ) {
        Array.from(document.getElementsByClassName(className)).forEach(
            (element) => {
                const newId = uuid();
                const doesExist = () => {
                    const node = document.getElementById(newId);
                    return !!node;
                };
                if (!doesExist()) {
                    element.id = newId;
                }
                this.ids.push(newId);
                this._elements[newId] = new ReactiveNode(
                    newId,
                    onError,
                    onLifecycle
                );
            }
        );
    }

    // TODO Add method to check if there are new elements with the class name and regenerate them

    private _elements: Record<string, ReactiveNode>;

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
}

export class Component {
    constructor(
        name: string,
        onError?: Observer<HTMLElement>["error"],
        onLifecycle?: Observer<HTMLElement>["complete"]
    ) {
        this._name = name;
        this._components = new ComponentTemplate(
            `rx-${name}`,
            onError,
            onLifecycle
        );
    }

    private _name: string;

    private _components: ComponentTemplate;

    // TODO populate the regenerate method on the component definition
    public regenerate(): void {
        this._components = new ComponentTemplate(
            `rx-${this._name}`,
            onError,
            onLifecycle
        );
    }
    

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

    public onEvent(
        event: string,
        action: (node: HTMLElement, payload?: unknown) => HTMLElement,
        onError?: (error: any) => void,
        onLifecycle?: () => void
    ) {
        this._components.addAction(`on${event}`, action);
        fromEvent(window, event).subscribe({
            next: () => {
                this._components.fireAction(`on${event}`);
            },
            error: onError,
            complete: onLifecycle,
        });
    }
}

export class ReactiveState<T> {
    constructor(public readonly initialState: T) {
        this.initialState = initialState;
        this._state = new BehaviorSubject<T>(initialState);
    }

    public subscription: Subscription;

    private _state: BehaviorSubject<T>;

    public update(value: T): void {
        this._state.next(value);
    }

    public subscribe(observer: Partial<Observer<T>>): Subscription {
        return this._state.subscribe(observer);
    }
}

export class ReactiveStream<T> {
    constructor() {
        this._state = new Subject<T>();
    }

    protected _state: Subject<T>;

    public subscribe(
        transform: (data: unknown) => T,
        observer: Observer<T>
    ): Subscription {
        return this._state.pipe(map(transform)).subscribe(observer);
    }

    public add(value: T): void {
        this._state.next(value);
    }
}

export class ReactiveEvent<T> {
    constructor(
        event: string,
        mapFunction: (event: Event, data?: unknown) => T
    ) {
        const source = fromEvent(window, event);
        this._stream = source.pipe(map(mapFunction));
    }

    protected _stream: Observable<T>;

    protected _subscriptions: Record<string, Subscription>;

    public subscribe(id: string, observer: Partial<Observer<T>>): void {
        this._subscriptions[id] = this._stream.subscribe(observer);
    }

    public unsubscribe(id: string): void {
        this._subscriptions[id].unsubscribe();
    }
}

export class ReactiveCustomEvent<
    T,
    K extends
        | HasEventTargetAddRemove<Event>
        | ArrayLike<HasEventTargetAddRemove<Event>>
> {
    constructor(
        event: string,
        target: K,
        mapFunction: (value: K, data?: unknown) => T,
        middleware?: OperatorFunction<Event | K, Event | K>
    ) {
        const source = fromEvent(target, event);
        this._stream = source.pipe(middleware, map(mapFunction));
    }

    protected _stream: Observable<T>;

    protected _subscriptions: Record<string, Subscription>;

    public subscribe(id: string, observer: Partial<Observer<T>>): void {
        this._subscriptions[id] = this._stream.subscribe(observer);
    }

    public unsubscribe(id: string): void {
        this._subscriptions[id].unsubscribe();
    }
}
export class ReactiveMediaQuery {
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

export const createWidthQuery = (
    max?: number,
    min?: number
): ReactiveMediaQuery => {
    const query = max
        ? min
            ? `(max-width: ${max}px) and (min-width: ${min}px)`
            : `(max-width: ${max}px)`
        : min
        ? `(min-width: ${min}px)`
        : "";
    return new ReactiveMediaQuery(query);
};

export const state = {
    UI: {
        media: {
            isMobile: new ReactiveState(false),
        },
        queries: {
            load: new ReactiveEvent<boolean>("load", (event) => true),
            mobile: createWidthQuery(768),
        },
    },
    data: {},
    nodes: {
        potato: new ReactiveNode("potato"),
    },
};

export const init = (): void => {
    state.UI.queries.mobile.subscribe("menu", {
        next: (matches) => state.UI.media.isMobile.update(matches),
    });
};

// TODO fix the typings of window and shit
// TODO clean, fix and extend this properly
// TODO make a more decent startup script
// TODO add a pug script shorthand to inject the reactivity into the given element
