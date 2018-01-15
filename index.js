const path = require('path');
const decache = require('decache');
const squba = require('squba')

const requireReg = /require\s*\((["'])([\w.\/]+)(?:\1)\)((?:\.[\w_-]+)*);?/igm;

const operator = {

    guardExportType (data, relativePath) {
        if (typeof data !== "object" || Array.isArray(data)) {
            throw new Error(`Value must be an object '${relativePath}'`)
        }
    },

    getVarData (relativePath, property) {
        const data = require(relativePath);
        decache(relativePath);
        if (!data) {
            throw new Error(`No data in '${relativePath}'`)
        }
        this.guardExportType(data, relativePath);
        if (property) {
            const propVal = squba(data, property);
            this.guardExportType(propVal, relativePath);
            return propVal;
        }
        return data;
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
            default:
                throw Error(`Unknown preprocessor type: ${type}`);

        }
    },

    mergeVarsToContent (content, webpackContext, preprocessorType) {
        const replacer = function (m,q, relativePath, property) {
            const modulePath = path.join(webpackContext.context, relativePath)
            const varData = this.getVarData(modulePath, property);
            webpackContext.addDependency(modulePath);
            return this.transformToStyleVars({
                type: preprocessorType,
                varData
            });
        }
        return content.replace(
            requireReg,
            replacer.bind(this)
        );
    },

    getResource (context) {
        return context._module.resource;
    },

    getPreprocessorType ( { resource } ={}) {
        const preProcs = [
            {
                type: 'sass',
                reg: /\.scss$|\.sass$/
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
