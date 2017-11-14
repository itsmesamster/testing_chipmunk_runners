import { Logs, TYPES                                                    } from '../tools.logs';
import { GUID                                                           } from '../tools.guid';
import { configuration as Configuration                                 } from '../../../core/modules/controller.config';
import { ParserDataIndex,  ParserData, ParserClass, ParsedResultIndexes } from './controller.data.parsers.tracker.inerfaces';
import { generator                                                      } from './controller.data.parsers.tracker.generator';
import { Manager                                                        } from './controller.data.parsers.tracker.manager';

class Parser implements ParserClass{
    protected manager   : Manager   = new Manager();
    protected sets      : any       = null;

    constructor(){
        this.sets = this.manager.load();
    }

    parseSegmentType(str: string, data: ParserData, GUID: string): Array<ParsedResultIndexes>{
        function apply(income: string, regsStr: Array<string>, output: Array<string>){
            regsStr.forEach((regStr: string)=>{
                let reg     = generator.getRegExp(regStr),
                    matches = [];
                if (reg !== null){
                    matches = regStr !== '' ? income.match(reg) : [income];
                    if (matches instanceof Array && matches.length > 0){
                        matches = matches.filter(match => match !== '');
                        matches.length > 0 && output.push(...matches);
                    }
                }
            });
            return output;
        };

        let segments    : Array<string>                 = [],
            values      : Array<string>                 = [],
            result      : Array<ParsedResultIndexes>    = [],
            key                                         = null;

        //Step 0. Get segments
        segments = apply(str, data.segments, segments);

        //Check cache
        key     = generator.getKey(GUID, segments);
        result  = generator.load(key);

        if (result === null){
            result = [];
            //Step 1. Get values from segments
            segments.forEach((segment: string)=>{
                apply(segment, data.values, values);
            });

            //Step 2. Clean up values
            values = values.map((value: string)=>{
                data.clearing.forEach((parserRegStr: string)=>{
                    value = value.replace(generator.getRegExp(parserRegStr), '');
                });
                return value;
            });

            //Step 3. Convert
            result = values.map((value: string)=>{
                if (data.indexes[value] !== void 0){
                    return {
                        index: data.indexes[value].index,
                        label: data.indexes[value].label
                    }
                } else {
                    return null;
                }
            }).filter(item => item !== null);

            //Step 4. Save cache
            result.length > 0 && generator.save(key, result);
        }

        return result;
    }

    parseKeysType(str: string, data: ParserData, GUID: string): Array<ParsedResultIndexes>{
        let result : Array<ParsedResultIndexes> = [],
            actual : boolean                    = false,
            key    : string                     = '';
        data.tests.forEach((test: string)=>{
            let reg = generator.getRegExp(test);
            !actual && (actual = reg.test(str));
        });

        if (actual){
            key     = generator.getKey(GUID, [str]);
            result  = generator.load(key);
            if (result === null){
                result = [];
                Object.keys(data.indexes).forEach((key: string)=>{
                    if (typeof data.indexes[key].value === 'string'){
                        ~str.indexOf(data.indexes[key].value) && result.push({
                            index: data.indexes[key].index,
                            label: data.indexes[key].label
                        });
                    }
                });
                result.length > 0 && generator.save(key, result);
            }
        }
        return result;
    }

    parseSet(str: string, data: ParserData, GUID: string): Array<ParsedResultIndexes>{
        let result : Array<ParsedResultIndexes> = [];
        if (data.segments instanceof Array){
            result = this.parseSegmentType(str, data, GUID);
        } else if (data.tests instanceof Array) {
            result = this.parseKeysType(str, data, GUID);
        }
        return result;
    }

    parse(str: string) : Object{
        let result = {};
        if (this.sets !== null && typeof this.sets === 'object'){
            Object.keys(this.sets).forEach((GUID: string)=>{
                let indexes = this.parseSet(str, this.sets[GUID], GUID);
                indexes.length > 0 && (result[GUID] = indexes);
            });
        }
        return Object.keys(result).length > 0 ? result : null;
    }

}

export { Parser }