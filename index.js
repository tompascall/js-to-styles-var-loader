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

    transformToLessVars (varData) {
        const keys = Object.keys(varData);
        return keys.reduce( (result, key) => {
            result += `@${key}: ${varData[key]};\n`;
            return result;
        }, '');
    },

    transformToStyleVars ({ type, varData } = {}) {
        switch (type) {
            case 'sass':
                return this.transformToSassVars(varData);
            case 'less':
                return this.transformToLessVars(varData);

        }
    },

    mergeVarsToContent (content, webpackContext, preprocessorType) {
        const [ moduleData, styleContent ] = this.divideContent(content);
        if (moduleData) {
            const modulePath = this.getModulePath(moduleData);
            const varData = this.getVarData(modulePath, webpackContext);
            const vars = this.transformToStyleVars({ type: preprocessorType, varData });
            return vars + styleContent;
        }
        else return content;
    },

    getResource (context) {
        return context._module.resource;
    },

    getPreprocessorType ( { resource } ={}) {
        const preProcs = [
            {
                type: 'sass',
                reg: /\.scss$/
            },
            {
                type: 'less',
                reg: /\.less$/
            }
        ];

        const result = preProcs.find( item => item.reg.test(resource));
        if (result) return result.type;
        throw Error(`Unknown preprocesor type for ${resource}`);
    }
};

exports.operator = operator;

const loader = function (content) {
    const webpackContext = this;
    const resource = operator.getResource(webpackContext);
    const preprocessorType = operator.getPreprocessorType({ resource });
    const merged = operator.mergeVarsToContent(content, webpackContext, preprocessorType);
    return merged;
};

exports.default = loader;
