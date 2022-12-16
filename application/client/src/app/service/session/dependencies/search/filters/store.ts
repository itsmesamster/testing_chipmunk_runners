import { Key, Store, StoredEntity } from '../store';
import { FilterRequest } from './request';
import { IFilter } from '@platform/types/filter';
import { DisableConvertable } from '../disabled/converting';

export { FilterRequest } from './request';

export class FiltersStore extends Store<FilterRequest> {
    public key(): Key {
        return Key.filters;
    }

    public addFromFilter(filter: IFilter): void {
        const request = new FilterRequest({ filter });
        this.update([request as StoredEntity<FilterRequest>]);
    }

    public tryRestore(smth: DisableConvertable): boolean {
        if (smth instanceof FilterRequest) {
            this.update([smth as StoredEntity<FilterRequest>]);
            return true;
        } else {
            return false;
        }
    }

    public getActiveCount(): number {
        return this.get().filter((request) => request.definition.active).length;
    }
}
