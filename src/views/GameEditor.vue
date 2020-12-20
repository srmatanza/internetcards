<template>
  <div class="gameEditor">
    <div class="heading">
      <h3>Game Editor</h3>

      <div>Player 1</div>
      <div>Player 2</div>
      <div>Player 3</div>
      <div>Game State</div>
      <div>Available Actions</div>

    </div>

    <div id="editorGrid" class="codeEditor">
      <div class="codeOptions">
        <h3>Card Game Rules</h3>
        <button @click="parseSharp()">Compile</button>
      </div>
      <div id="sharpEditor"></div>
    </div>
  </div>
</template>

<script>
// import _ from 'lodash'

// import Player from '@/components/Player.vue'

import * as CC from '@/cards.js'
import Instance from '@/instance.js'
import sharp2json from '@/sharp/transpile.js'

export default {
  name: 'gameEditor',
  data: function() {
    return {
      instance: new Instance(),
      playerSelections: {},
      sharpContent: '',
      Cards: CC,
      editor: {}
    }
  },
  components: {
    // Player
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
    parseSharp: function() {
      this.sharpContent = this.editor.getValue()
      console.log('code: ', this.sharpContent)
      try {
        const gameObj = sharp2json(this.sharpContent)

        console.log('Game Object')
        console.log(gameObj)

        this.setupGameState(gameObj)
      } catch(ex) {
        console.log('uh oh: ', ex)
      }
    },
    setupGameState: function(ruleset) {
      this.instance.setupGameState(ruleset)
    }
  },
  computed: {
    //
  }
}
</script>

<style scoped>
#editorGrid {
  height: 500px;
}
#sharpEditor {
  width: 100%;
  height: 100%;
}
.gameEditor {
  padding: 25px;
  display: grid;
  grid-template-columns: 4fr 3fr;
}

.codeOptions {
  padding: 5px;
}

</style>
