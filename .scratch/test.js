console.log("test")
var expTask = {
  taskname: "test",
  taskfunc1: "taskfunc1"
}

var funcs = {
taskfunc1: function (a){
  console.log(a)
},
}

console.log(expTask.taskname)

console.log(expTask["taskname"])
funcs[expTask["taskfunc1"]](88);
