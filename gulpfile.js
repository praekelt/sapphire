var gulp = require('gulp');
var less = require('gulp-less');
var karma = require('gulp-karma');
var browserify = require('browserify');
var source = require('vinyl-source-stream');


gulp.task('scripts', function () {
  browserify('./src/scripts/sapphire.js')
    .exclude('d3')
    .bundle({standalone: 'sapphire'})
    .pipe(source('sapphire.js'))
    .pipe(gulp.dest("./build"));
});


gulp.task('styles', function () {
  return gulp
    .src('./src/styles/sapphire.less')
    .pipe(less())
    .pipe(gulp.dest('./build'));
});


gulp.task('build', function () {
  gulp.start('scripts', 'styles');
});


gulp.task('test', ['styles'], function() {
  return gulp
    .src([
      './build/sapphire.css',
      './src/scripts/**/*.js',
      './test/**/*.test.js'
    ])
    .pipe(karma({
      action: 'run',
      frameworks: ['mocha', 'chai', 'commonjs'],
      reporters: ['mocha'],
      browsers: ['PhantomJS'],
      preprocessors: {
        'src/scripts/**/*.js': ['commonjs'],
        'test/*.js': ['commonjs']
      }
    }));
});


gulp.task('default', function () {
  gulp.start('build');
});


gulp.task('watch', function() {
  gulp.watch('src/scripts/**/*.js', ['scripts']);
});
