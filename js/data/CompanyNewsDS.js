import Datasource from "./Datasource"

export default class CompanyNewsDS extends Datasource {

    constructor(url) {
        super(url);


        // Initial set of notes, loop through and add to list
        /*   socket.on('initial notes', function(data){
               var html = ''
               for (var i = 0; i < data.length; i++){
                   // We store html as a var then add to DOM after for efficiency
                   html += '<li>' + data[i].note + '</li>'
               }
               console.warn("'initial notes':",html)
           })

           // New note emitted, add it to our list of current notes
           socket.on('new note', function(data){
               $('#notes').append('<li>' + data.note + '</li>')
           })

           // New socket connected, display new count on page
           socket.on('users connected', function(data){
               console.warn('users connected:','Users connected: ' + data)
           })

           // Add a new (random) note, emit to server to let others know
           $('#newNote').click(function(){
               var newNote = 'This is a random ' + (Math.floor(Math.random() * 100) + 1)  + ' note'
               socket.emit('new note', {note: newNote})
           })

   */


    }


    onNewsReceived(callback) {
        //TODO work in progress .. we might not need such convenience functions
        this.mSocket.on('read news', callback)

    }


}