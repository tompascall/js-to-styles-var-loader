import path from 'path';
const loader = require('../index').default;
const { operator } = require('../index');

describe('js-to-styles-vars-loader', () => {

    describe('module', () => {
        const context = {
            context: path.resolve(),
            _module: {
                resource: 'fakeResource.scss'
            },
            addDependency () {}
        };

        it('exports a function', () => {
            expect(typeof loader).toEqual('function');
        });

        it('calls getResource with context', () => {
            spyOn(operator, 'getResource').and.callThrough();
            loader.call(context, 'asdf');
            expect(operator.getResource).toHaveBeenCalledWith(context);

        });

        it('calls getPreprocessorType with resource', () => {
            spyOn(operator, 'getPreprocessorType');
            loader.call(context, 'asdf');
            expect(operator.getPreprocessorType).toHaveBeenCalledWith({ resource: context._module.resource });
        });

        it('calls operator.mergeVarsToContent with content and loader context, and preprocessor type', () => {
            spyOn(operator, 'mergeVarsToContent');
            loader.call(context, 'asdf');
            expect(operator.mergeVarsToContent).toHaveBeenCalledWith('asdf', context, 'sass');

        });

        it('returns the result of mergeVarsToContent', () => {
            const content = 'require("./mocks/colors.js")\n' + '.someClass {\ncolor: $nice;\n}';
            const merged = operator.mergeVarsToContent(content, context, 'sass');
            const result = loader.call(context, content);
            expect(result).toEqual(merged);
        });
    });

    describe('divideContent', () => {
        it('divides the require (if it exists) from the content', () => {
            const content = "require('colors.js');\n" +
                ".someClass { color: #fff;}";
            expect(operator.divideContent(content)[0]).toEqual("require('colors.js');");
            expect(operator.divideContent(content)[1]).toEqual("\n.someClass { color: #fff;}");
        });

        it('gives back content if there is no require in content', () => {
            const content = ".someClass { color: #fff;}";
            expect(operator.divideContent(content)[0]).toEqual("");
            expect(operator.divideContent(content)[1]).toEqual(content);
        });

        it('handles more requires when divide', () => {
            const content = "require('colors.js');\n" +
                "require('sizes.js');\n" +
                ".someClass { color: #fff;}";
            expect(operator.divideContent(content)[0]).toEqual("require('colors.js');\n" + "require('sizes.js');");
            expect(operator.divideContent(content)[1]).toEqual("\n.someClass { color: #fff;}");
        });

        it('handles the form of request("asdf").someProp', () => {
            const content = "require('corners.js').typeOne;\n" + ".someClass { color: #fff;}";
            expect(operator.divideContent(content)[0]).toEqual("require('corners.js').typeOne;");
        });
    });

    describe('getModulePath', () => {
        it('extracts module paths and methodName into an array', () => {
            expect(operator.getModulePath('require("./mocks/colors.js");\n')).toEqual([{path: "./mocks/colors.js"}]);

            expect(operator.getModulePath('require("./mocks/colors.js");\n' + 'require("./mocks/sizes.js");')).toEqual([{path: "./mocks/colors.js"}, {path:"./mocks/sizes.js"}]);

            expect(operator.getModulePath('require("./mocks/corners.js").typeTwo;\n')).toEqual([{path: "./mocks/corners.js", methodName: 'typeTwo'}]);
        });
    });

    describe('getVarData', () => {
        const context = {
            context: path.resolve(),
            addDependency () {}
        };

        it('gets variable data by modulePath with context', () => {
            const varData = operator.getVarData([{path: './mocks/colors.js' }], context);
            expect(varData).toEqual({ white: '#fff', black: '#000'});
        });

        it('merges module data if there are more requests', () => {
            const varData = operator.getVarData([{path:'./mocks/colors.js'}, {path:'./mocks/sizes.js'}], context);
            expect(varData).toEqual({ white: '#fff', black: '#000', small: '10px', large: '50px'});
        });

        it('handles methodName if it is given', () => {
            const varData = operator.getVarData([{ path:'./mocks/corners.js', methodName: 'typeOne'}], context);
            expect(varData).toEqual({ tiny: '1%', medium: '3%'});
        });

        it('call context.addDependecy with modulePath', () => {
            spyOn(context, 'addDependency');
            const relativePath = './mocks/corners.js';
            operator.getVarData([{ path: relativePath, methodName: 'typeOne'}], context);
            expect(context.addDependency).toHaveBeenCalledWith(path.resolve(relativePath));
        });
    });

    describe('transformToSassVars', () => {
        it('takes a hash object and transforms it to sass variables', () => {
            const colors = require('../mocks/colors.js');
            expect(operator.transformToSassVars(colors)).toEqual('$white: #fff;\n$black: #000;\n');
        });
    });

    describe('transformToLessVars', () => {
        it('takes a hash object and transforms it to less variables', () => {
            const colors = require('../mocks/colors.js');
            expect(operator.transformToLessVars(colors)).toEqual('@white: #fff;\n@black: #000;\n');
        });
    });

    describe('mergeVarsToContent', () => {
        const context = {
            context: path.resolve(),
            addDependency () {}
        };

        it('inserts vars to styles content', () => {
            const content = "require('./mocks/colors.js');\n" +
                ".someClass { color: #fff;}";
            const [ moduleData, stylesContent ] = operator.divideContent(content);
            const modulePath = operator.getModulePath(moduleData);
            const varData = operator.getVarData(modulePath, context);
            const vars = operator.transformToStyleVars({ type: 'less', varData });

            expect(operator.mergeVarsToContent(content, context, 'less')).toEqual(vars + stylesContent);
        });

        it('gives back content as is if there is no requre', () => {
            const content = ".someClass { color: #fff;}";
            expect(operator.mergeVarsToContent(content, context)).toEqual(content);
        });
    });

    describe('getResource', () => {
        it('gets module.resource', () => {
        const context = {
            _module: {
                resource: 'fakeResource',
                addDependency () {}
            }
        };

        expect(operator.getResource(context)).toEqual(context._module.resource);
        });
    });

    describe('getPreprocessorType', () => {
        it('should recognise sass resource', () => {
            expect(operator.getPreprocessorType({ resource: '/path/to/resource.scss'})).toEqual('sass');
        });

        it('should recognise less resource', () => {
            expect(operator.getPreprocessorType({ resource: '/path/to/resource.less'})).toEqual('less');
        });

        it('throw error if proprocessor type is unknown', () => {
            const caller = () => {
                operator.getPreprocessorType({ resource: 'unknown.extension'});
            };
            expect(caller).toThrow();
        });
    });

    describe('transformToStyleVars', () => {
        it('calls the proper transformer by type', () => {
            spyOn(operator, 'transformToSassVars');
            spyOn(operator, 'transformToLessVars');
            operator.transformToStyleVars({ type: 'sass', varData: {} });
            expect(operator.transformToSassVars).toHaveBeenCalled();

            operator.transformToStyleVars({ type: 'less', varData: {} });
            expect(operator.transformToLessVars).toHaveBeenCalled();
        });

        it('throws error is type is unknown', () => {
            const caller = () => {
                operator.transformToStyleVars({ type: 'unknown' });
            };

            expect(caller).toThrow();
        });
    });
});
