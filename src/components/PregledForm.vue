<template>
  <div class="modal-overlay" v-if="show" @click.self="onClose">
    <div class="modal-content form-modal">
      <h2>{{ isEdit ? 'Uredi pregled' : 'Novi pregled' }}</h2>

      <form @submit.prevent="save">
        <div class="form-row">
          <label>Tip pregleda</label>
          <select v-model="form.examinationType" required>
            <option disabled value="">-- odaberi --</option>
            <option v-for="(naziv, sifra) in examinationTypes" :key="sifra" :value="sifra">
              {{ sifra }} – {{ naziv }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label>Datum i vrijeme</label>
          <input type="datetime-local" v-model="form.examinationDateLocal" required />
        </div>

        <div class="form-row">
          <label>Napomene</label>
          <textarea v-model="form.notes" rows="3" placeholder="Opcionalno"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="onClose">Odustani</button>
          <button type="submit" class="btn-primary">{{ isEdit ? 'Spremi' : 'Dodaj' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  show: { type: Boolean, default: false },
  pregled: { type: Object, default: null },   // null => create
  pacijentId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'saved'])

const examinationTypes = {
  GP: 'Opći tjelesni pregled',
  KRV: 'Test krvi',
  'X-RAY': 'Rendgensko skeniranje',
  CT: 'CT sken',
  MR: 'MRI sken',
  ULTRA: 'Ultrazvuk',
  EKG: 'Elektrokardiogram',
  ECHO: 'Ehokardiogram',
  EYE: 'Pregled očiju',
  DERM: 'Dermatološki pregled',
  DENTA: 'Pregled zuba',
  MAMMO: 'Mamografija',
  NEURO: 'Neurološki pregled'
}

const isEdit = computed(() => !!(props.pregled && props.pregled.id != null))

const form = reactive({
  examinationType: '',
  // za <input type="datetime-local">
  examinationDateLocal: '',
  notes: ''
})

function toLocalInputValue(dateIso) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function resetForm() {
  if (isEdit.value) {
    form.examinationType = props.pregled?.examinationType || ''
    form.examinationDateLocal = toLocalInputValue(props.pregled?.examinationDate)
    form.notes = props.pregled?.notes || ''
  } else {
    form.examinationType = ''
    form.examinationDateLocal = ''
    form.notes = ''
  }
}

watch(() => props.show, (val) => { if (val) resetForm() })
onMounted(() => { if (props.show) resetForm() })

const onClose = () => emit('close')

async function save() {
  try {
    const iso = form.examinationDateLocal
      ? new Date(form.examinationDateLocal).toISOString()
      : null

    const payload = {
      examinationType: form.examinationType,
      examinationDate: iso,
      notes: form.notes
    }

    let res
    if (isEdit.value) {
      // EDIT: PUT /api/patients/{id}/Examinations/{examId}
      res = await api.put(
        `/patients/${props.pacijentId}/Examinations/${props.pregled.id}`,
        payload
      )
    } else {
      // CREATE: POST /api/patients/{id}/Examinations
      res = await api.post(
        `/patients/${props.pacijentId}/Examinations`,
        payload
      )
    }

    emit('saved', res.data)
    emit('close')
  } catch (error) {
    console.error('❌ Greška pri spremanju pregleda:', error)
    const msg = error?.response?.data?.message || error?.response?.data || error?.message || 'Nepoznata greška'
    alert(`Došlo je do greške: ${msg}`)
  }
}
</script>

<style scoped>
.form-modal { max-width: 520px; }
.form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-primary, .btn-secondary { padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.btn-primary { background: #2563eb; color: #fff; border: none; }
.btn-secondary { background: #e5e7eb; color: #111827; border: none; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: grid; place-items: center; }
.modal-content { background: #fff; padding: 20px; border-radius: 12px; width: 100%; max-width: 600px; }
</style>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
}

h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #34495e;
}

select, input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}

select:focus, input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
}

textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-cancel, .btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.btn-submit {
  background: #27ae60;
  color: white;
}

.btn-submit:hover {
  background: #229954;
}
</style>