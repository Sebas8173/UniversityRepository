const js = require("@eslint/js"); // importa la configuracion base de eslint para javascript

//exportación del arreglo de configuraciones especificas
module.exports = [
    {
        files: ['src/**/*.js'], //aplica a todos los archivos js en la carpeta src y subcarpetas
        languageOptions:{
            ecmaVersion: 2021, //version que va a leer en adelante para javascript
            sourceType: 'commonjs' //tipo de modulo que se va a usar
        },
        rules: {
            ...js.configs.recommended.rules,
            semi: ['error', 'always'], //uso de punto y coma siempre
            quotes: ['error', 'single'] //uso de comillas simples siempre
        }
    }
]
