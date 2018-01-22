const path = require('path');
const decache = require('decache');
const squba = require('squba')

const requireReg = /require\s*\((["'])([\w.\/]+)(?:\1)\)((?:\.[\w_-]+)*);?/igm;

const operator = {

    validateExportType (data, relativePath) {
        if (Object.prototype.toString.call(data) !== '[object Object]') {
            throw new Error(`Export must be an object '${relativePath}'`);
        }
    },

    // Ensure it is a flat object with finite number/string values.
    validateVariablesValue(value, property, relativePath) {
        if (Object.prototype.toString.call(value) !== '[object Object]') {
            throw new Error(`Only an object can be converted to style vars (${relativePath}${property})`);
        }

        const keys = Object.keys(value);
        for (const k of keys) {
            if (!(
                // Define ok types of value (can be output as a style var)
                typeof value[k] === "string"
                || (typeof value[k] === "number" && Number.isFinite(value[k]))
            )) {
                throw new Error(
                    `Style vars must have a value of type "string" or "number". Only flat objects are supported. ` +
                    `In: ${relativePath}${property ? ":" : ""}${property}`);
            }
        }

        return true;
    },

    getVarData (relativePath, property) {
        decache(relativePath);
        const data = require(relativePath);
        if (!data) {
            throw new Error(`No data in '${relativePath}'`);
        }
        this.validateExportType(data, relativePath);
        if (property) {
            const propVal = squba(data, property);
            this.validateExportType(propVal, relativePath);
            this.validateVariablesValue(propVal, property, relativePath)
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

    propDeDot (strPropMatch) {
        if (!strPropMatch || strPropMatch[0] !== ".")
            return strPropMatch;
        else
            return strPropMatch.substr(1);
    },

    mergeVarsToContent (content, webpackContext, preprocessorType) {
        const replacer = function (m,q, relativePath, property) {
            const modulePath = path.join(webpackContext.context, relativePath)
            const varData = this.getVarData(modulePath, this.propDeDot(property));
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
