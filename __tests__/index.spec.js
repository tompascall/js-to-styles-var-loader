import path from 'path';
const loader = require('../index').default;
const { operator } = require('../index');

describe('js-to-sass-vars-loader', () => {

    describe('module', () => {
        const context = {
            context: path.resolve()
        };

        it('exports a function', () => {
            expect(typeof loader).toEqual('function');
        });

        it('calls operator.mergeVarsToContent with content and loader context', () => {
            spyOn(operator, 'mergeVarsToContent');
            loader.call(context, 'asdf');
            expect(operator.mergeVarsToContent).toHaveBeenCalledWith('asdf', context);

        });

        it('returns the result of mergeVarsToContent', () => {
            const content = 'require("./mocks/colors.js")\n' + '.someClass {\ncolor: $nice;\n}';
            const merged = operator.mergeVarsToContent(content, context);
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
        const context = { context: path.resolve()};

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
    });

    describe('transformToSassVars', () => {
        it('takes a hash object and transforms it to sass variables', () => {
            const colors = require('../mocks/colors.js');
            expect(operator.transformToSassVars(colors)).toEqual('$white: #fff;\n$black: #000;\n');
        });
    });

    describe('mergeVarsToContent', () => {
        const context = {
            context: path.resolve()
        };

        it('inserst vars to sass content', () => {
            const content = "require('./mocks/colors.js');\n" +
                ".someClass { color: #fff;}";
            const [ moduleData, sassContent ] = operator.divideContent(content);
            const modulePath = operator.getModulePath(moduleData);
            const varData = operator.getVarData(modulePath, context);
            const sassVars = operator.transformToSassVars(varData);

            expect(operator.mergeVarsToContent(content, context)).toEqual(sassVars + sassContent);
        });

        it('gives back content as is if there is no requre', () => {
            const content = ".someClass { color: #fff;}";
            expect(operator.mergeVarsToContent(content, context)).toEqual(content);
        });
    });
});
