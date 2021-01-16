<template>
  <div class="topHeader">
    <div class="home-menu pure-menu pure-menu-horizontal">
      <span class="pure-menu-heading">Internet Car<a class="hiddenLink" href="/dashboard">d</a>s</span>
      <ul class="pure-menu-list">
        <li class="pure-menu-item" v-for="link in links" :key="link.name">
          <a :href="link.href" class="pure-menu-link">{{ link.name }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
export default {
  name: 'topHeader',
  props: [
    'links'
  ],
  data: function() {
    return {
    }
  }
}
</script>
<style scoped>
.pure-menu-heading > a:visited,
.pure-menu-heading > a:hover,
.pure-menu-heading > a:link {
  text-decoration: none;
  color: white;
}
.hiddenLink {
  cursor: initial;
}
.topHeader {
  height: 80px;
}
</style>
