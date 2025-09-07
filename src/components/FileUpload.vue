<template>
  <div class="file-upload">
    <input
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      style="display: none"
      multiple
      accept=".jpg,.jpeg,.png,.pdf,.dicom,.dcm"
    />

    <button @click="triggerFileInput" class="btn-upload" :disabled="uploading">
      📁 {{ uploading ? 'Uploading...' : 'Odaberi datoteke' }}
    </button>

    <div v-if="selectedFiles.length > 0" class="selected-files">
      <h4>Odabrane datoteke:</h4>
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
        <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
        <button @click="removeFile(index)" class="btn-remove">✕</button>
      </div>

      <button @click="uploadFiles" class="btn-primary" :disabled="uploading">
        {{ uploading ? 'Uploadam...' : `Uploadaj ${selectedFiles.length} datoteka` }}
      </button>
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps({
  examinationId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['uploaded'])

const fileInput = ref(null)
const selectedFiles = ref([])
const uploading = ref(false)
const message = ref('')
const messageType = ref('')

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  const validFiles = files.filter(file => {
    if (file.size > 20 * 1024 * 1024) {
      alert(`❌ ${file.name} je prevelik (max 20MB)`)
      return false
    }
    return true
  })

  selectedFiles.value = validFiles
  clearMessage()
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  uploading.value = true
  clearMessage()

  try {
    let successful = 0
    let failed = 0
    const results = []

    for (const file of selectedFiles.value) {
      try {
        const formData = new FormData()
        formData.append('file', file) // MORA se zvati "file"

        // TOČAN endpoint (interceptor će prefiksati /api)
        const res = await api.post(
          `/examinations/${props.examinationId}/ExaminationFiles/upload`,
          formData
          // nikakav 'Content-Type' ne postavljati ručno!
        )

        results.push(res.data)
        successful++
      } catch (e) {
        console.error('❌ Upload error za datoteku:', file.name, e)
        failed++
      }
    }

    if (successful > 0) {
      showMessage(`✅ Uspješno uploadano ${successful} datoteka`, 'success')
    }
    if (failed > 0) {
      showMessage(`⚠️ Neuspješno: ${failed} datoteka`, 'error')
    }

    emit('uploaded', { successful, failed, results })
    selectedFiles.value = []
  } catch (error) {
    console.error('❌ Upload error (global):', error)
    const errorMsg = error.response?.data?.message || error.message || 'Nepoznata greška'
    showMessage(`❌ Greška: ${errorMsg}`, 'error')
  } finally {
    uploading.value = false
  }
}

const formatFileSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(3, Math.max(0, Math.floor(Math.log(bytes || 1) / Math.log(1024))))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}

const showMessage = (text, type) => {
  message.value = text
  messageType.value = type
  setTimeout(() => clearMessage(), 5000)
}

const clearMessage = () => {
  message.value = ''
  messageType.value = ''
}

defineExpose({
  clearFiles: () => {
    selectedFiles.value = []
    clearMessage()
  }
})
</script>


<style scoped>
.file-upload {
  padding: 1rem;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin: 1rem 0;
}

.btn-upload {
  background: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-upload:hover:not(:disabled) {
  background: #0056b3;
}

.btn-upload:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.selected-files {
  margin-top: 1rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 5px 0;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-primary {
  background: #28a745;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;
}

.btn-primary:hover:not(:disabled) {
  background: #218838;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  font-weight: 500;
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