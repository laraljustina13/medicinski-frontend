<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ editMode ? 'Uredi pregled' : 'Novi pregled' }}</h2>
      
      <form @submit.prevent="savePregled">
        <div class="form-group">
          <label>Tip pregleda *</label>
          <select v-model="form.examinationType" required>
            <option value="">Odaberite tip pregleda</option>
            <option v-for="(name, code) in examinationTypes" :key="code" :value="code">
              {{ name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Datum pregleda *</label>
          <input v-model="form.examinationDate" type="datetime-local" required/>
        </div>

        <div class="form-group">
          <label>Napomene</label>
          <textarea v-model="form.notes" placeholder="Opis pregleda ili nalaza..." rows="3"/>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn-cancel">Odustani</button>
          <button type="submit" class="btn-save">{{ editMode ? 'Spremi' : 'Dodaj' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({
  show: Boolean,
  pregled: Object,
  pacijentId: Number
})

const emit = defineEmits(['close', 'saved'])

const examinationTypes = {
  'GP': 'Opći tjelesni pregled',
  'KRV': 'Test krvi', 
  'X-RAY': 'Rendgensko snimanje',
  'CT': 'CT sken',
  'MR': 'MRI sken',
  'ULTRA': 'Ultrazvuk',
  'EKG': 'Elektrokardiogram',
  'ECHO': 'Ehokardiogram',
  'EYE': 'Pregled očiju',
  'DERM': 'Dermatološki pregled',
  'DENTA': 'Pregled zuba',
  'MAMMO': 'Mamografija',
  'NEURO': 'Neurološki pregled'
}

const editMode = ref(false)
const form = reactive({
  examinationType: '',
  examinationDate: '',
  notes: ''
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.pregled) {
      editMode.value = true
      Object.assign(form, props.pregled)
    } else {
      editMode.value = false
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    examinationType: '',
    examinationDate: '',
    notes: ''
  })
}

const closeModal = () => {
  emit('close')
  resetForm()
}

const savePregled = async () => {
  try {
    const payload = {
      patientId: props.pacijentId,
      examinationType: form.examinationType,
      examinationDate: new Date(form.examinationDate).toISOString(),
      notes: form.notes
    }

    if (editMode.value) {
      await api.put(`/patients/${props.pacijentId}/examinations/${props.pregled.id}`, payload)
    } else {
      await api.post(`/patients/${props.pacijentId}/examinations`, payload)
    }
    
    emit('saved')
    closeModal()
    alert(editMode.value ? 'Pregled uspješno uređen!' : 'Pregled uspješno dodan!')
  } catch (error) {
    console.error('❌ Greška pri spremanju pregleda:', error)
    alert('Došlo je do greške pri spremanju pregleda')
  }
}
</script>