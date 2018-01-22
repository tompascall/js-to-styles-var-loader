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

    describe('validation', () => {
      it ("validateExportType() throws on anything except an object, does not throw otherwise", () => {
        const areOk = [{}, {a: "foo"}];
        const areNotOk = [[], ["a"], "", "123", 123, false, true, null, undefined, NaN];
        expect(() => {
            for (const okThing of areOk) {
                operator.validateExportType(okThing, "");
            }
        }).not.toThrow();
        for (const notOkThing of areNotOk) {
            expect(() => {
                operator.validateExportType(notOkThing, "");
                console.error(`Should have thrown on ${typeof notOkThing} '${notOkThing}'`);
            },).toThrow();

        }
      })

      it ("validateVariablesValue() throws on nested objects or invalid object property values", () => {
        const areOk = [
            {a: "foo"},
            {a: 100.1},
            {a: 100},
            {a: ""},
            {a: 0},
            {a: 0},
            {},
        ];
        const areNotOk = [
            "",
            100.1,
            [],
            null,
            undefined,
            {a: 1/"bad"},
            {b: []},
            {c: ["bad"]},
            {d: [100.1]},
            {e: () => "bad"},
            {f: {}},
            {g: { b: "bad"} },
            {h: "foo", b: {}},
            {i: "foo", b: { c: "bad" }},
            {j: "foo", b: { c: 100}}
        ];
        expect(() => {
            for (const okThing of areOk) {
                operator.validateVariablesValue(okThing, "");
            }
        }).not.toThrow();
        for (const notOkThing of areNotOk) {
            expect(() => {
                operator.validateVariablesValue(notOkThing, "", "nofile.js");
                operator.validateVariablesValue(notOkThing, "some.thing", "nofile.js");
                console.error(`Should have thrown on ${typeof notOkThing} '${JSON.stringify(notOkThing)}'`);
            },).toThrow();

        }
      })
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

        it('throws on an missing module', () => {
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/this_is_not_an_existing_file.js'));
            }).toThrow();
        })
        it('throws on a non-object export', () => {
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/null_export.js'));
            }).toThrow();
        })



        it('throws on an empty property', () => {
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'empty');
            }).toThrow();
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'notEmptyObject');
            }).not.toThrow();
        })

        it('does not throw on an empty object', () => {
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'emptyObject');
            }).not.toThrow();
        })

        it('throws on a non-object property', () => {
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'falsey');
            }).toThrow();
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'truthy');
            }).toThrow();
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'emptyArray');
            }).toThrow();
            expect(() => {
                operator.getVarData(path.join(context.context, './mocks/bad_exports.js'), 'nonEmptyArray');
            }).toThrow();

        })

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
            ".someClass { color: #fff; }";

        it('inserts vars to styles content', () => {
            operator.mergeVarsToContent(content, context, 'less')

            expect(operator.mergeVarsToContent(content, context, 'less'))
                .toEqual("@white: #fff;\n@black: #000;\n\n.someClass { color: #fff; }");
        });

        it('call context.addDependecy', () => {
            spyOn(context, 'addDependency');
            const dependencyPath = path.join(context.context, './mocks/colors.js');
            operator.mergeVarsToContent(content, context, 'less')
            expect(context.addDependency).toHaveBeenCalledWith(path.resolve(dependencyPath));
        });

        it('gives back content as-is if there is no require', () => {
            const content = ".someClass { color: #fff;}";
            expect(operator.mergeVarsToContent(content, context)).toEqual(content);
        });

        it("inserts variables inside style blocks and does not fail if the last 'require' is inside a block", () => {
          const content = fs.readFileSync(path.resolve('./mocks/case1.less'), 'utf8');
          const expectedContent = fs.readFileSync(path.resolve('./mocks/case1_expected.less'), 'utf8');
          const merged = operator.mergeVarsToContent(content, {...context, context: path.resolve('./mocks/')}, 'less');
          expect(merged.trim()).toEqual(expectedContent.trim());
        })

        it("imports nested props", () => {
          const content = fs.readFileSync(path.resolve('./mocks/case2.less'), 'utf8');
          const expectedContent = fs.readFileSync(path.resolve('./mocks/case2_expected.less'), 'utf8');
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
            expect(operator.getPreprocessorType({ resource: '/path/to/resource.sass'})).toEqual('sass');
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
