const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'css');
const modulesDir = path.join(cssDir, 'modules');

if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir);
if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir);

const stylesPath = path.join(__dirname, 'styles.css');
const htmlPath = path.join(__dirname, 'index.html');

let stylesContent = fs.readFileSync(stylesPath, 'utf8');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract inline CSS from index.html
const styleRegex = /<style>([\s\S]*?)<\/style>/;
const match = htmlContent.match(styleRegex);
let layoutCss = '';
if (match) {
    layoutCss = match[1].trim();
    htmlContent = htmlContent.replace(styleRegex, '');
}

// 2. Simple regex search to pull out module-specific CSS from styles.css
// We will look for comments like /* QuickLog... */ or selectors like #clca-view
function extractByCommentPattern(content, pattern) {
    const regex = new RegExp(`\\/\\*\\s*${pattern}[\\s\\S]*?(?=\\/\\*|$)`, 'g');
    let extracted = '';
    content = content.replace(regex, (match) => {
        extracted += match + '\n';
        return '';
    });
    return { content, extracted };
}

let quicklogCss = '';
let clcaCss = '';
let mesdailyCss = '';
let settingsCss = '';
let componentsCss = '';

// Quicklog
let res = extractByCommentPattern(stylesContent, 'QuickLog');
quicklogCss += res.extracted;
stylesContent = res.content;

// Mes Daily
res = extractByCommentPattern(stylesContent, 'MES Daily|MES Travel Card');
mesdailyCss += res.extracted;
stylesContent = res.content;

// CLCA
res = extractByCommentPattern(stylesContent, 'CLCA|#clca-view');
clcaCss += res.extracted;
stylesContent = res.content;

// Settings
res = extractByCommentPattern(stylesContent, 'Settings');
settingsCss += res.extracted;
stylesContent = res.content;

// Components
res = extractByCommentPattern(stylesContent, 'Toast|Buttons|Console|Cards|Generate Button|Progress Bar');
componentsCss += res.extracted;
stylesContent = res.content;

// Remaining goes to base.css
let baseCss = stylesContent;

// 3. Write files
fs.writeFileSync(path.join(cssDir, 'layout.css'), layoutCss);
fs.writeFileSync(path.join(cssDir, 'components.css'), componentsCss);
fs.writeFileSync(path.join(modulesDir, 'quicklog.css'), quicklogCss);
fs.writeFileSync(path.join(modulesDir, 'clca.css'), clcaCss);
fs.writeFileSync(path.join(modulesDir, 'mesdaily.css'), mesdailyCss);
fs.writeFileSync(path.join(cssDir, 'settings.css'), settingsCss);
fs.writeFileSync(path.join(cssDir, 'base.css'), baseCss);

// 4. Update index.html links
const links = `
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/modules/clca.css">
    <link rel="stylesheet" href="css/modules/mesdaily.css">
    <link rel="stylesheet" href="css/modules/quicklog.css">
    <link rel="stylesheet" href="css/settings.css">
`;

htmlContent = htmlContent.replace('<link rel="stylesheet" href="styles.css">', links);
fs.writeFileSync(htmlPath, htmlContent);

// Remove old styles.css
fs.unlinkSync(stylesPath);

console.log("CSS Split completed.");
