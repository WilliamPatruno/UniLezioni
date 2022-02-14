// Creazione dello schema evento

const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  materia: {
    type: String,
    required: true
  },
  aula: {
    type: String,
    required: true
  },
  capienza: {
    type: Number,
    required: true,
    default: 100
  },
  date: {                   
    type: Date,
    required: true
  }, 
  startTime: {              
    type: String,
    required: true
  },
  endTime: {                
    type: String,
    required: true
  },
  docente: {
    type: String,
    required: true
  },
  contacts: {               //email del docente
    type: String,
    required: true
  },
  iscritti: {               //numero di studenti iscritti
    type: Number,
    default: 0
  },
  studentiIscritti: [{      //array degli studenti iscritti
    type: String
  }]
})

module.exports = mongoose.model('Event', eventSchema) 