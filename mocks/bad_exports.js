module.exports = {
  // bad
  falsey: "",
  truthy: true,
  emptyArray: [],
  nonEmptyArray: ["also bad"],

  // valid
  emptyObject: {},
  notEmptyObject: {
    thing: "value"
  }
}
