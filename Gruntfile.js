module.exports = function(grunt) {

   require('load-grunt-tasks')(grunt);

   grunt.initConfig({

      clean: ["dist"],

      copy: {
         src_to_dist: {
            cwd: 'src',
            expand: true,
            src: ['**/*', '!**/*.js', '!**/*.scss'],
            dest: 'dist'
         },
         readme: {
            expand: true,
            src: ['README.md'],
            dest: 'dist'
         }
      },

      eslint: {
         src: ['src']
      },

      babel: {
         options: {
            sourceMap: true,
            presets:  ['es2015']
         },
         dist: {
            options: {
               plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of']
            },
            files: [{
               cwd: 'src',
               expand: true,
               src: ['**/*.js'],
               dest: 'dist',
               ext:'.js'
            }]
         }
      }

  });

  grunt.registerTask('default', ['clean', 'copy', 'eslint', 'babel']);
};
