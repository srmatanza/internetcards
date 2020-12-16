<template>
<div>
  <div class="gameEditor home pure-g">
    <div class="pure-u-1 pure-u-md-1-3">
      <h3>Game Editor</h3>
      <button @click="getContent()">Click</button>
    </div>
    <div id="editorGrid" class="pure-u-1 pure-u-md-1-3">
      <div id="sharpEditor"></div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'gameEditor',
  data: function() {
    return {
      sharpContent: '',
      editor: {}
    }
  },
  mounted: function() {
    console.log('Game Editor mounted...')
    this.editor = window.ace.edit('sharpEditor')
    this.editor.setValue(this.sharpContent)
    // this.editor.on('change', this.getContent)
    // editor.setTheme('ace/theme/monokai')
    // editor.session.setMode('ace/mode/javascript')
  },
  methods: {
    getContent: function() {
      console.log('code: ', this.editor.getValue())
    }
  },
  computed: {
    //
  }
}
</script>

<style scoped>
#editorGrid {
  height: 600px;
}
#sharpEditor {
  width: 100%;
  height: 100%;
}
</style>
