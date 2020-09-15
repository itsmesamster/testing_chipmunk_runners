export interface ISelectionPoint {
    position: number;
    offset: number;
    text: string;
}

export interface ICommentedSelection {
    start: ISelectionPoint;
    end: ISelectionPoint;
    text: string;
}

export enum ECommentState {
    done = 'done',
    pending = 'pending',
}

export interface IComment {
    guid: string;
    state: ECommentState;
    comment: string;
    selection: ICommentedSelection;
}

export interface IActualSelectionData {
    selection: string;
    start: number;
    end: number;
}
