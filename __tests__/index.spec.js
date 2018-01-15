import path from 'path';
import fs from 'fs';
const loader = require('../index').default;
jest.mock('decache');
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

        it('handles .sass extension for sass files', () => {
            const sassContext = { ...context, _module: { resource: 'fakeResource.sass' } };
            spyOn(operator, 'mergeVarsToContent');
            loader.call(sassContext, 'sdfg');
            expect(operator.mergeVarsToContent).toHaveBeenCalledWith('sdfg', sassContext, 'sass');
        });

        it('returns the result of mergeVarsToContent', () => {
            const content = 'require("./mocks/colors.js")\n' + '.someClass {\ncolor: $nice;\n}';
            const merged = operator.mergeVarsToContent(content, context, 'sass');
            const result = loader.call(context, content);
            expect(result).toEqual(merged);
        });
    });



    describe('getVarData', () => {
        const context = {
            context: path.resolve(),
            addDependency () {}
        };

        it('gets variable data by modulePath with context', () => {
            const varData = operator.getVarData(path.join(context.context, './mocks/colors.js'));
            expect(varData).toEqual({ white: '#fff', black: '#000'});
        });

        it('uses value from property', () => {
            const varData = operator.getVarData(path.join(context.context, './mocks/corners.js'), 'typeOne');
            expect(varData).toEqual({ tiny: '1%', medium: '3%'});
        });
        it('uses value from nested property', () => {
            const varData = operator.getVarData(path.join(context.context, './mocks/corners.js'), 'deep.nested');
            expect(varData).toEqual({ color: '#f00'});
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
        const content = "require('./mocks/colors.js');\n" +
            ".someClass { color: #fff;}";

        const trimmer = (str) => {
          return (str.split("\n").filter(a => a).map(s => s.trim()).join(" ")).trim()
        };

        it('inserts vars to styles content', () => {
            operator.mergeVarsToContent(content, context, 'less')

            expect(trimmer(operator.mergeVarsToContent(content, context, 'less'))).toEqual(trimmer(`
              @white: #fff; @black: #000; ; .someClass { color: #fff;}
            `));
        });

        it('call context.addDependecy', () => {
            spyOn(context, 'addDependency');
            const dependencyPath = path.join(context.context, './mocks/colors.js');
            operator.mergeVarsToContent(content, context, 'less')
            expect(context.addDependency).toHaveBeenCalledWith(path.resolve(dependencyPath));
        });

        it('gives back content as is if there is no requre', () => {
            const content = ".someClass { color: #fff;}";
            expect(operator.mergeVarsToContent(content, context)).toEqual(content);
        });

        it("inserts variables inside style blocks and does not fail if the last 'require' is inside a block", () => {
          const content = fs.readFileSync(path.resolve('./mocks/case1.less'), 'utf8');
          const expectedContent = fs.readFileSync(path.resolve('./mocks/case1_expected.less'), 'utf8');
          const merged = operator.mergeVarsToContent(content, {...context, context: path.resolve('./mocks/')}, 'less');
          expect(merged.trim()).toEqual(expectedContent.trim());
        })
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
