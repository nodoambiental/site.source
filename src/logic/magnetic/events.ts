import {
    map,
    fromEvent,
    Observable,
    Subscription,
    Observer,
    startWith,
    OperatorFunction,
} from "rxjs";
import { HasEventTargetAddRemove } from "rxjs/internal/observable/fromEvent";

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
