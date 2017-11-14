
const STYLES = {
    1   : 'ANSI-font-bold',
    3   : 'ANSI-font-italic',
    4   : 'ANSI-font-underline',
    30  : 'ANSI-font-black',
    31  : 'ANSI-font-red',
    32  : 'ANSI-font-green',
    33  : 'ANSI-font-yellow',
    34  : 'ANSI-font-blue',
    35  : 'ANSI-font-magenta',
    36  : 'ANSI-font-cyan',
    37  : 'ANSI-font-white',
    40  : 'ANSI-font-background-black',
    41  : 'ANSI-font-background-red',
    42  : 'ANSI-font-background-green',
    43  : 'ANSI-font-background-yellow',
    44  : 'ANSI-font-background-blue',
    45  : 'ANSI-font-background-magenta',
    46  : 'ANSI-font-background-cyan',
    47  : 'ANSI-font-background-white',
};

const REGS = {
    //COLORS          : new RegExp('\\033\\[[\\d;]{1,}m[^(\\33\\[)]*', 'g'),
    COLORS          : new RegExp('\\033\\[[\\d;]{1,}m[^\\33]*', 'g'),
    COLORS_VALUE    : new RegExp('\\33\\[.*?m', 'g'),
    CLEAR_COLORS    : new RegExp('[\\33\\[m]', 'g'),
    BEGIN           : new RegExp('^[^\\33]*', 'g'),
};

const ANSIReader = function(str : string){
    let parts = str.match(REGS.COLORS);
    if (parts instanceof Array && parts.length > 0){
        let _begin  = str.match(REGS.BEGIN),
            result  = _begin instanceof Array ? (_begin.length > 0 ? _begin[0] : '') : '';
        parts.forEach((part)=>{
            let values  = part.match(REGS.COLORS_VALUE),
                value   = values instanceof Array ? (values.length === 1 ? values[0].replace(REGS.CLEAR_COLORS, '') : null) : null,
                text    = part.replace(REGS.COLORS_VALUE, ''),
                tag     = '';
            if (value !== null){
                value.split(';').forEach((value)=>{
                    STYLES[value] !== void 0 && (tag += ' ' + STYLES[value]);
                });
                text = tag !== '' ? ('<span class="' + tag + '">' + text + '</span>') : text;
            }
            result = result + text;
        });
        return result;
    }
    return str;
};
export { ANSIReader };
