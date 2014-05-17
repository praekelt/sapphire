var gulp = require('gulp');
var browserify = require('gulp-browserify');


gulp.task('scripts', function () {
  gulp
    .src("./src/scripts/sapphire.js")
    .pipe(browserify({standalone: 'sapphire'}))
    .pipe(gulp.dest("./build"));
});


gulp.task('build', function () {
  gulp.start('scripts');
});


gulp.task('default', function () {
  gulp.start('build');
});


gulp.task('watch', function() {
  gulp.watch('src/scripts/**/*.js', ['scripts']);
});
