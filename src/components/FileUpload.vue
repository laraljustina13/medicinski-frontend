<template>
  <div class="file-upload">
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      style="display: none"
      accept=".jpg,.jpeg,.png,.pdf,.dicom,.dcm"
    >
    
    <button @click="triggerFileInput" class="btn-upload">
      📁 Upload medicinskog filea
    </button>

    <div v-if="selectedFile" class="file-info">
      <p><strong>Odabran file:</strong> {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
      <button @click="uploadFile" class="btn-primary" :disabled="uploading">
        {{ uploading ? 'Uploading...' : '📤 Uploadaj' }}
      </button>
      <button @click="clearFile" class="btn-cancel">❌ Odustani</button>
    </div>

    <div v-if="uploadStatus" class="upload-status" :class="{ success: uploadSuccess, error: !uploadSuccess }">
      {{ uploadStatus }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps({
  pacijent: {
    type: Object,
    required: true
  }
})

const fileInput = ref(null)
const selectedFile = ref(null)
const uploadStatus = ref('')
const uploadSuccess = ref(false)
const uploading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validacija veličine (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    alert('❌ File je prevelik! Maksimalna veličina je 20MB.')
    clearFile()
    return
  }

  // Validacija tipa
  const validTypes = [
    'image/jpeg', 
    'image/png', 
    'application/pdf', 
    'application/dicom',
    'image/dicom',
    'image/dcm'
  ]
  
  if (!validTypes.includes(file.type)) {
    alert('❌ Nepodržan format filea. Dopušteno: JPG, PNG, PDF, DICOM')
    clearFile()
    return
  }

  selectedFile.value = file
  uploadStatus.value = ''
}

const uploadFile = async () => {
  if (!selectedFile.value || !props.pacijent?.id) {
    alert('❌ Nema filea ili podataka o pacijentu!')
    return
  }

  uploading.value = true
  uploadStatus.value = '⏳ Upload u tijeku...'

  try {
    // 1. Prvo kreiraj novi pregled za pacijenta
    const pregledResponse = await api.post('/api/examinations', {
      patientId: props.pacijent.id,
      examinationType: 'GP',
      examinationDate: new Date().toISOString(),
      notes: `Upload filea: ${selectedFile.value.name}`
    })

    const examinationId = pregledResponse.data.id
    console.log('✅ Novi pregled kreiran ID:', examinationId)

    // 2. Uploadaj file na novi pregled
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const uploadResponse = await api.post(
      `/api/examinations/${examinationId}/upload`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    uploadStatus.value = '✅ File uspješno uploadan!'
    uploadSuccess.value = true
    
    console.log('📁 Upload response:', uploadResponse.data)

    // Emit event parent komponenti
    emit('uploaded', {
      file: uploadResponse.data,
      examination: pregledResponse.data
    })

    // Auto-close nakon 2 sekunde
    setTimeout(() => {
      clearFile()
    }, 2000)

  } catch (error) {
    console.error('❌ Upload error:', error)
    uploadStatus.value = `❌ Greška pri uploadu: ${error.response?.data || error.message}`
    uploadSuccess.value = false
  } finally {
    uploading.value = false
  }
}

const clearFile = () => {
  selectedFile.value = null
  uploadStatus.value = ''
  uploadSuccess.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

// Emit za parent komponentu
const emit = defineEmits(['uploaded'])
</script>

<style scoped>
.file-upload {
  margin: 20px 0;
}

.btn-upload {
  padding: 10px 20px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.file-info {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.upload-status {
  margin-top: 10px;
  padding: 10px;
  border-radius: 5px;
}

.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>