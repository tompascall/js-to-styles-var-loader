const path = require('path');

const requireReg = /require\s*\(['|"](.+)['|"]\)(?:\.([^;\s]+))?[;\s]/g;

const operator = {
    divideContent (content) {
        let match;
        let lastIndex;
        const reg = new RegExp(requireReg);
        while (match = reg.exec(content)) {
            lastIndex = reg.lastIndex;
        }
        if (typeof lastIndex !== 'undefined') {
            return [
                content.slice(0, lastIndex),
                content.slice(lastIndex)
            ];
        }
        else {
            return ['', content];
        }
    },

    getModulePath (modulePart) {
        const reg = new RegExp(requireReg);
        const modulePaths = [];
        let match;
        while (match = reg.exec(modulePart)) {
            modulePaths.push({
                path: match[1],
                methodName: match[2]
            });
        }
        return modulePaths;
    },

    getVarData (modulePath, webpackContext) {
        return modulePath.reduce( (accumulator, currentPath) => {
            const moduleData = (currentPath.methodName)? require(path.join(webpackContext.context, currentPath.path))[currentPath.methodName] : require(path.join(webpackContext.context, currentPath.path));
            return Object.assign(accumulator, moduleData);
        }, {});
    },

    transformToSassVars (varData) {
        const keys = Object.keys(varData);
        return keys.reduce( (result, key) => {
            result += `$${key}: ${varData[key]};\n`;
            return result;
        }, '');
    },

    mergeVarsToContent (content, webpackContext) {
        const [ moduleData, sassContent ] = this.divideContent(content);
        if (moduleData) {
            const modulePath = this.getModulePath(moduleData);
            const varData = this.getVarData(modulePath, webpackContext);
            const sassVars = this.transformToSassVars(varData);
            return sassVars + sassContent;
        }
        else return content;
    }
};

exports.operator = operator;

const loader = function (content) {
    const webpackContext = this;
    const merged = operator.mergeVarsToContent(content, webpackContext);
    return merged;
};

exports.default = loader;
