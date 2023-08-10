import { Subject, Subjects } from '@platform/env/subscription';
import { LimittedValue } from '@ui/env/entities/value.limited';
import { hash } from '@platform/env/str';
import { scope } from '@platform/env/scope';
import { bridge } from '@service/bridge';
import { error } from '@platform/log/utils';

export interface Header {
    caption: string;
    desc: string;
    visible: boolean;
    width: LimittedValue | undefined;
    color: string | undefined;
    index: number;
}
export class Columns {
    public readonly headers: Header[];
    protected styles: Array<{ [key: string]: string }> = [];

    public subjects: Subjects<{
        resized: Subject<number>;
        visibility: Subject<number>;
        colorize: Subject<number>;
    }> = new Subjects({
        resized: new Subject(),
        visibility: new Subject(),
        colorize: new Subject(),
    });

    constructor(
        headers: {
            caption: string;
            desc: string;
        }[],
        visability: boolean[] | boolean,
        widths: number[],
        min: number[] | number,
        max: number[] | number,
    ) {
        const headersVisability =
            visability instanceof Array
                ? visability
                : Array.from({ length: headers.length }, () => true);
        const maxWidths =
            max instanceof Array ? max : Array.from({ length: headers.length }, () => max);
        const minWidths =
            min instanceof Array ? min : Array.from({ length: headers.length }, () => min);
        this.headers = headers.map((header, i) => {
            return {
                caption: header.caption,
                desc: header.desc,
                width:
                    widths[i] === -1
                        ? undefined
                        : new LimittedValue(
                              `column_width_${i}`,
                              minWidths[i],
                              maxWidths[i],
                              widths[i],
                          ),
                visible: headersVisability[i],
                color: '#FFFFFF',
                index: i,
            };
        });
        this.styles = this.headers.map((h) => {
            return { width: `${h.width === undefined ? '' : `${h.width.value}px`}` };
        });
        this.storage().load();
    }

    public toggleVisibility(column: number): void {
        if (this.headers[column] === undefined) {
            throw new Error(`Invalid index of column`);
        }
        this.headers[column].visible = !this.headers[column].visible;
        this.subjects.get().visibility.emit(column);
        this.storage().save();
    }

    public visible(column: number): boolean {
        if (this.headers[column] === undefined) {
            throw new Error(`Invalid index of column`);
        }
        return this.headers[column].visible;
    }

    public setColor(column: number, color: string): void {
        if (this.headers[column] === undefined) {
            throw new Error(`Invalid index of column`);
        }
        this.headers[column].color = color;
        this.subjects.get().colorize.emit(column);
        this.storage().save();
    }

    public getColor(column: number): string | undefined {
        if (this.headers[column] === undefined) {
            throw new Error(`Invalid index of column`);
        }
        return this.headers[column].color;
    }

    public setWidth(column: number, width: number) {
        if (isNaN(width) || !isFinite(width)) {
            throw new Error(`Invalid width column value`);
        }
        const value = this.headers[column].width;
        value !== undefined && value.set(width);
        this.subjects.get().resized.emit(column);
    }

    public getWidth(column: number): number | undefined {
        const value = this.headers[column].width;
        return value !== undefined ? value.value : undefined;
    }

    public getStyle(column: number): { [key: string]: string } {
        const style = this.styles[column];
        if (style === undefined) {
            return {};
        }
        const width = this.getWidth(column);
        if (width === undefined) {
            style['width'] = '';
        } else {
            style['width'] = `${width}px`;
        }

        const color = this.getColor(column);
        if (color !== undefined) {
            style['color'] = color;
        } else {
            style['color'] = '';
        }
        return style;
    }

    protected hash(): string {
        return hash(this.headers.map(header => header.caption).join(';')).toString();
    }

    protected storage(): { load (): void; save (): void } {
        const logger = scope.getLogger('columnsController');

        return {
            load: () => {
                bridge.storage(this.hash()).read()
                .then((content) => {
                    try {
                        const headers = JSON.parse(content);
                        if (!(headers instanceof Array)) {
                            throw new Error('Headers not an array');
                        }
                        if (headers.length !== this.headers.length) {
                            throw new Error('Header length mismatched');
                        }
                        this.headers.forEach((header, index) => {
                            if (headers[index].width !== undefined) {
                                header.width?.set(headers[index].width);
                                this.subjects.get().resized.emit(index);
                            }
                            if (headers[index].color !== undefined) {
                                header.color = headers[index].color;
                                this.subjects.get().colorize.emit(index);
                            }
                            if (header.visible !== headers[index].visible) {
                                header.visible = headers[index].visible;
                                this.subjects.get().visibility.emit(index);
                            }
                        });
                    } catch (err) {
                        logger.error(error(err));
                    }
                })
                .catch(error => logger.error(error.message));
            },
            save: () => {
                bridge.storage(this.hash()).write(JSON.stringify(this.headers.map((header) => {
                    return {
                        width: header.width === undefined ? undefined : header.width.value,
                        color: header.color,
                        visible: header.visible,
                     };
                }))).catch(error => {
                    logger.error(error.message);
                });
        }
    }
}};
