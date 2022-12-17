import { Component, ChangeDetectorRef, AfterContentInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Ilc, IlcInterface } from '@env/decorators/component';
import { ChangesDetector } from '@ui/env/extentions/changes';
import { State } from './state';
import { Initial } from '@env/decorators/initial';

import * as Scheme from './scheme';

@Component({
    selector: 'app-elements-tree',
    templateUrl: './template.html',
    styleUrls: ['./styles.less'],
})
@Initial()
@Ilc()
export class ElementsTreeSelector extends ChangesDetector implements AfterContentInit {
    public state: State;

    constructor(cdRef: ChangeDetectorRef, private _sanitizer: DomSanitizer) {
        super(cdRef);
        this.state = new State(this);
    }

    public ngAfterContentInit(): void {
        this.state.init(this.ilc().services, this.log()).catch((err: Error) => {
            this.log().error(`Fail to init folder's tree state: ${err.message}`);
        });
    }

    public safeHtml(html: string): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(html);
    }

    public hasChild(_: number, _nodeData: Scheme.DynamicFlatNode): boolean {
        return _nodeData.expandable;
    }

    public ngItemContextMenu(event: MouseEvent, entity: Scheme.Entity) {
        if (entity.favourite) {
            this.ilc().emitter.ui.contextmenu.open({
                items: [
                    {
                        caption: 'Delete from favourites',
                        handler: () => {
                            this.state.removePlace(entity.getPath());
                            this.detectChanges();
                        },
                    },
                ],
                x: event.x,
                y: event.y,
            });
            return;
        }
        if (entity.isFolder()) {
            this.ilc().emitter.ui.contextmenu.open({
                items: [
                    {
                        caption: 'Add to favourites',
                        handler: () => {
                            this.state.addPlace(entity.getPath());
                            this.detectChanges();
                        },
                    },
                ],
                x: event.x,
                y: event.y,
            });
            return;
        }
        this.ilc().emitter.ui.contextmenu.open({
            items: [
                {
                    caption: 'Open as text',
                    handler: () => {
                        this.ilc()
                            .services.system.opener.file(entity.getPath())
                            .text()
                            .catch((err: Error) => {
                                this.log().error(`Fail to open text file; error: ${err.message}`);
                            });
                    },
                },
                {
                    caption: 'Open as DLT',
                    handler: () => {
                        console.log(`Not implemented`);
                    },
                },
                {
                    caption: 'Open as PCAP',
                    handler: () => {
                        console.log(`Not implemented`);
                    },
                },
            ],
            x: event.x,
            y: event.y,
        });
    }

    public onScrolling(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
    }

    public add() {
        this.ilc()
            .services.system.bridge.folders()
            .select()
            .then((paths: string[]) => {
                paths.forEach((path) => {
                    this.state.addPlace(path);
                });
            });
    }
}
export interface ElementsTreeSelector extends IlcInterface {}
