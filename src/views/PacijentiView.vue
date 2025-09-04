<template>
  <div class="pacijenti-container">
    <!-- HEADER -->
    <div class="header">
      <h1>Upravljanje pacijentima</h1>
      <div class="actions">
        <button @click="showDodajPacijenta" class="btn-primary">+ Novi pacijent</button>
        <button @click="exportToCSV" class="btn-secondary">📊 Izvezi CSV</button>
      </div>
    </div>

    <!-- PRETRAGA -->
    <div class="search-section">
      <div class="search-inputs">
        <input v-model="searchlastName" placeholder="Pretraži po prezimenu..." class="search-input"/>
        <input v-model="searchOIB" placeholder="Pretraži po OIB-u..." class="search-input" maxlength="11"/>
        <button @click="fetchPatients" class="btn-search">🔍 Pretraži</button>
      </div>
    </div>

    <!-- TABLICA PACIJENATA -->
    <div class="table-container">
      <table v-if="pacijenti.length > 0">
        <thead>
          <tr>
            <th>OIB</th><th>Ime</th><th>Prezime</th><th>Datum rođenja</th><th>Spol</th><th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pacijent in pacijenti" :key="pacijent.id">
            <td>{{ pacijent.oib }}</td>
            <td>{{ pacijent.firstName }}</td>
            <td>{{ pacijent.lastName }}</td>
            <td>{{ formatDate(pacijent.dateOfBirth) }}</td>
            <td>{{ pacijent.gender === 'F' ? 'Ž' : 'M' }}</td>
            <td>
              <button @click="editPacijent(pacijent)" class="btn-edit">✏️ Uredi</button>
              <button @click="viewDetails(pacijent)" class="btn-details">👁️ Detalji</button>
              <button @click="viewPovijestBolesti(pacijent)" class="btn-medical">📋 Povijest bolesti</button> 
               <button @click="deletePacijent(pacijent)" class="btn-delete">🗑️ Obriši</button>
               <button @click="viewPregledi(pacijent)" class="btn-medical">🏥 Pregledi</button>
               <button @click="viewRecepti(pacijent)" class="btn-medical">💊 Recepti</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-data">Nema pronađenih pacijenata.</p>
    </div>

    <!-- MODAL ZA PACIJENTA -->
    <PacijentForm 
      :show="showModal"
      :pacijent="selectedPacijent"
      @close="closeModal"
      @saved="handleSaved"
    />

    <PacijentDetails 
  :show="showDetailsModal"
  :pacijent="selectedPacijentDetails"
  @close="closeDetailsModal"
/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'
import PacijentForm from '../components/PacijentForm.vue'
import PacijentDetails from '@/components/PacijentDetails.vue'

const router = useRouter()

const showDetailsModal = ref(false)
const selectedPacijentDetails = ref(null)

const viewDetails = (pacijent) => {
  selectedPacijentDetails.value = pacijent
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
}

// State
const pacijenti = ref([])
const searchlastName = ref('')
const searchOIB = ref('')
const showModal = ref(false)
const selectedPacijent = ref(null)

// Modal methods
const showDodajPacijenta = () => {
  selectedPacijent.value = null
  showModal.value = true
}

const editPacijent = (pacijent) => {
  selectedPacijent.value = pacijent
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPacijent.value = null
}

const handleSaved = () => {
  fetchPatients() // Refresh listu nakon spremanja
}





// Dohvati pacijente
const fetchPatients = async () => {
  try {
    console.log('🔄 Starting fetchPatients...')
    const response = await api.get('/patients')
    console.log('✅ API Response:', response.data)
    
    let filteredPatients = response.data
    console.log('📊 Total patients from API:', filteredPatients.length)
    
    if (searchlastName.value) {
      filteredPatients = filteredPatients.filter(p => 
        p.lastName.toLowerCase().includes(searchlastName.value.toLowerCase())
      )
      console.log('🔍 After lastName filter:', filteredPatients.length)
    }
    
    if (searchOIB.value) {
      filteredPatients = filteredPatients.filter(p => 
        p.oib.includes(searchOIB.value)
      )
      console.log('🔍 After OIB filter:', filteredPatients.length)
    }
    
    pacijenti.value = filteredPatients
    console.log('🎯 Final patients count:', pacijenti.value.length)
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju pacijenata:', error)
  }

}



const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('hr-HR')
}

onMounted(() => {
  console.log('🔄 Component mounted, fetching patients...')
  fetchPatients()
})

// 👇 OVDJE DODAJ deletePacijent METODU!
const deletePacijent = async (pacijent) => {
  console.log('🗑️ Pokrećem brisanje pacijenta:', pacijent.id, pacijent.firstName, pacijent.lastName)
  
  if (!confirm(`Jeste li sigurni da želite obrisati pacijenta: ${pacijent.firstName} ${pacijent.lastName}?`)) {
    console.log('❌ Brisanje otkazano')
    return
  }

  try {
    console.log('🔄 Brišem pacijenta ID:', pacijent.id)
    await api.delete(`/patients/${pacijent.id}`)
    console.log('✅ Pacijent uspješno obrisan')
    alert('Pacijent uspješno obrisan!')
    fetchPatients() // Refresh list
  } catch (error) {
    console.error('❌ Greška pri brisanju pacijenta:', error)
    console.error('Status:', error.response?.status)
    console.error('Podaci:', error.response?.data)
    alert('Došlo je do greške pri brisanju pacijenta: ' + (error.response?.data || error.message))
  }
}


// Export CSV
const exportToCSV = () => {
  if (pacijenti.value.length === 0) {
    alert('Nema podataka za izvoz!')
    return
  }

  try {
    // Prepare CSV data
    const csvData = pacijenti.value.map(pacijent => ({
      OIB: pacijent.oib,
      Ime: pacijent.firstName,
      Prezime: pacijent.lastName,
      'Datum rođenja': new Date(pacijent.dateOfBirth).toLocaleDateString('hr-HR'),
      Spol: pacijent.gender === 'F' ? 'Ženski' : 'Muški',
      'Datum kreiranja': pacijent.createdAt ? new Date(pacijent.createdAt).toLocaleDateString('hr-HR') : '-'
    }))

    // Create CSV content
    const headers = Object.keys(csvData[0])
    const csvRows = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${row[header]}"`).join(',')
      )
    ].join('\n')

    // Download
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `pacijenti_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    alert('CSV datoteka je uspješno preuzeta! 📊')
    
  } catch (error) {
    console.error('Greška pri CSV exportu:', error)
    alert('Došlo je do greške pri izvozu podataka')
  }
}

const viewPovijestBolesti = (pacijent) => {
  console.log('🔄 Odlazim na povijest bolesti za pacijenta:', pacijent.id)
  console.log('Router available:', !!router)
  router.push(`/pacijenti/${pacijent.id}/povijest-bolesti`)
}

const viewPregledi = (pacijent) => {
  router.push(`/pacijenti/${pacijent.id}/pregledi`)
}

const viewRecepti = (pacijent) => {
  router.push(`/pacijenti/${pacijent.id}/recepti`)
}
</script>


<style scoped>
.pacijenti-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.search-section {
  margin-bottom: 20px;
}

.search-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-primary, .btn-secondary, .btn-search, .btn-edit, .btn-details {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-search { background: #28a745; color: white; }
.btn-edit { background: #ffc107; color: black; margin-right: 5px; }
.btn-details { background: #17a2b8; color: white; }
.btn-delete { 
  background: #dc3545; 
  color: white; 
  margin-left: 5px; 
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>