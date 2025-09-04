<script setup>
// Osnovna konfiguracija - može ostati prazno za sada
</script>

<template>
  <div id="app">
    <main>
      <router-view></router-view> <!-- 👈 Ovo je KLJUČNO za router -->
    </main>
  </div>
</template>

<style>
/* Globalni stilovi */
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
