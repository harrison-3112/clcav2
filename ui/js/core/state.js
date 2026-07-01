const MODULES = {
    clca: {
        id: 'clca',
        cardClass: 'card-clca',
        cardAccent: 'primary',
        cardIcon: 'bolt',
        singleInputLayout: true,
        icon: 'file-bar-chart-2',
        menuTitle: { en: 'CLCA Generator', cn: 'CLCA 生成器' },
        title: { en: 'CLCA Gen', cn: 'CLCA Gen' },
        summary: { en: 'Defect handling per station', cn: '按站点处理不良' },
        endpoint: '/api/generate',
        outputKey: 'clca_last_output_path',
        stationKey: 'clca_last_stations',
        defaultOutputName: 'CLCA_Report.xlsx',
        needsStations: true,
        fields: [
            { key: 'data', required: true, multiple: true, icon: 'database', grad: 'from-primary via-secondary to-cyan-400', label: { en: 'Data File', cn: '数据文件' }, accept: '.xlsx,.xls' }
        ]
    },

    mesdaily: {
        id: 'mesdaily',
        cardClass: 'card-yield',
        cardAccent: 'yield',
        cardIcon: 'calendar_month',
        icon: 'calendar-days',
        menuTitle: { en: 'MES Daily', cn: 'MES Daily' },
        title: { en: 'MES Daily', cn: 'MES Daily' },
        summary: { en: 'Generate daily MES report', cn: '生成每日 MES 报表' },
        endpoint: '/api/generate/mesdaily',
        outputKey: 'mesdaily_last_output_path',
        stationKey: 'mesdaily_last_stations',
        defaultOutputName: 'MES_Daily_Report.xlsx',
        needsStations: true,
        fields: []
    },


    quicklog: {
        id: 'quicklog',
        cardClass: 'card-quicklog',
        cardAccent: 'primary',
        cardIcon: 'search',
        icon: 'search',
        menuTitle: { en: 'QuickLog', cn: 'QuickLog' },
        title: { en: 'QuickLog', cn: 'QuickLog' },
        summary: { en: 'Fast SN log lookup', cn: '快速查询 SN 日志' },
        endpoint: '/api/quicklog/search',
        outputKey: 'quicklog_last_output_path',
        stationKey: 'quicklog_last_stations',
        defaultOutputName: 'QuickLog_Result.xlsx',
        needsStations: false,
        fields: [],
        uiOnly: false
    },

};


let activeModule = 'clca';

let activePreset = null;

const selectedStationsByModule = Object.fromEntries(Object.keys(MODULES).map((key) => [key, new Set()]));

const stateByModule = Object.fromEntries(Object.keys(MODULES).map((key) => [key, { files: {}, output: '', mergeAll: false, useCsnMapping: false, mergeSheetPrefixes: {} }]));


let allStations = [];

const MES_DATEPICKER_LOCALES = {
    en: {
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        today: 'Today',
        clear: 'Clear',
        dateFormat: 'yyyy-MM-dd',
        firstDay: 0
    },
    cn: {
        days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        daysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        daysMin: ['日', '一', '二', '三', '四', '五', '六'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        today: '今天',
        clear: '清除',
        dateFormat: 'yyyy-MM-dd',
        firstDay: 1
    }
};


const QUICKLOG_MES_TRACE_FILTERS = ['ALL', 'SMT', 'DIP', 'FATP', 'PASS', 'FAIL'];
const QUICKLOG_LOCAL_FILTERS = ['ALL', 'PASS', 'FAIL'];
const MES_R001_FILTERS = ['ALL', 'SMT', 'DIP', 'FATP'];

const STATUS_COLORS = {
    waiting: 'bg-status-waiting',
    ready: 'bg-status-ready',
    generating: 'bg-status-generating',
    success: 'bg-status-success',
    error: 'bg-status-error'
};


// UI initialization moved to main.js DOMContentLoaded