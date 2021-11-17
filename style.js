var app = new Vue({
  el: '#app',
  data: {
  	todoLists: [
    ],
    newTitleToggle: false,
    newTitle: "",
  },
  methods: {
  	checkEnteredValue(){
    	if(this.newTitle !== ""){
      	this.newTitleToggle = true;
      }else{
      	this.newTitleToggle = false;
      }
    },
  	addToDoList(){
      this.todoLists.push({
        title: this.newTitle,
        checkToggle: false
      });
      this.newTitleToggle = false;
      this.newTitle = '';
  	},
    deleteToDoList(){
    	this.todoLists = this.todoLists.filter(function(list) {
        return list.checkToggle === false; 
      });
    }
	}
})
