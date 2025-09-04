<template>
  <div class="modal-overlay" v-if="show" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ editMode ? 'Uredi pacijenta' : 'Novi pacijent' }}</h2>
      
      <form @submit.prevent="savePacijent">
        <div class="form-group">
          <label>OIB *</label>
          <input v-model="form.OIB" required maxlength="11" placeholder="Unesite OIB"/>
        </div>

        <div class="form-group">
          <label>Ime *</label>
          <input v-model="form.FirstName" required placeholder="Unesite ime"/>
        </div>

        <div class="form-group">
          <label>Prezime *</label>
          <input v-model="form.LastName" required placeholder="Unesite prezime"/>
        </div>

        <div class="form-group">
          <label>Datum rođenja *</label>
          <input v-model="form.DateOfBirth" type="date" required/>
        </div>

        <div class="form-group">
          <label>Spol *</label>
          <select v-model="form.Gender" required>
            <option value="">Odaberite spol</option>
            <option value="M">Muški</option>
            <option value="F">Ženski</option>
          </select>
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
  pacijent: Object
})

const emit = defineEmits(['close', 'saved'])

const editMode = ref(false)
const form = reactive({
  OIB: '',
  FirstName: '',
  LastName: '',
  DateOfBirth: '',
  Gender: ''
})

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.pacijent) {
      // Edit mode
      editMode.value = true
      Object.assign(form, props.pacijent)
    } else {
      // Add mode
      editMode.value = false
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    OIB: '',
  FirstName: '',
  LastName: '',
  DateOfBirth: '',
  Gender: ''
  })
}

const closeModal = () => {
  emit('close')
  resetForm()
}

const savePacijent = async () => {
  try {
    // 👇 KREIRAJ PAYLOAD s ispravnim formatom
    const payload = {
      OIB: form.OIB,
      FirstName: form.FirstName,
      LastName: form.LastName,
      DateOfBirth: new Date(form.DateOfBirth).toISOString(), // 👈 ISO format
      Gender: form.Gender.charAt(0) // 👈 Samo prvo slovo (M, F, O)
    }
    
    console.log('🔄 Šaljem podatke:', JSON.stringify(payload, null, 2))
    
    let response
    if (editMode.value) {
      console.log('✏️ Edit mode - ID:', props.pacijent.id)
      
      // 👇 Za update koristi UpdatePatientDto (bez OIB-a)
      const updatePayload = {
        FirstName: form.FirstName,
        LastName: form.LastName, 
        DateOfBirth: new Date(form.DateOfBirth).toISOString(),
        Gender: form.Gender.charAt(0)
      }
      
      response = await api.put(`/patients/${props.pacijent.id}`, updatePayload)
    } else {
      console.log('🆕 Add mode')
      response = await api.post('/patients', payload)
    }
    
    console.log('✅ Uspjeh:', response.data)
    emit('saved')
    closeModal()
    alert(editMode.value ? 'Pacijent uspješno uređen!' : 'Pacijent uspješno dodan!')
  } catch (error) {
    console.error('❌ Cijela greška:', error)
    console.error('❌ Status:', error.response?.status)
    console.error('❌ Podaci:', error.response?.data) // 👈 Ovo će pokazati validation errors
    console.error('❌ URL:', error.config?.url)
    console.error('❌ Request data:', error.config?.data)
    
    if (error.response?.status === 400) {
      alert('Validation error: ' + JSON.stringify(error.response?.data))
    } else if (error.response?.status === 500) {
      alert('Backend greška! Provjeri konzolu za detalje.')
    } else {
      alert('Greška: ' + (error.response?.data?.message || error.message))
    }
  }
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>