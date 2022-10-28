var gulp = require('gulp'),
    { series, parallel } = require('gulp'),
    fs = require('fs'),
    tsNode = require('ts-node'),
    babel = require('gulp-babel'),
    ts = require('gulp-typescript'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass')(require('sass')),
    concatCss = require('gulp-concat-css'),
    cleanCSS = require('gulp-clean-css'),
    livereload = require('gulp-livereload'),
    replace = require('gulp-string-replace'),
    htmlmin = require('gulp-htmlmin');

function clear(target) {
    return function clear() {
        return gulp.src(target, { allowEmpty: true })
            .pipe(clean());
    }
}

function transpileTS() {
    return gulp.src(
        ['**/*.ts', '!node_modules/**', '!*.ts'], { allowEmpty: true })
        .pipe(ts({
            noImplicitAny: true,
            outFile: 'transpiled.js'
        }))
        .pipe(gulp.dest('tmp'))
}

function concatenateJS() {
    return gulp.src([
        '**/*.js', '!node_modules/**', '!*.js'], { allowEmpty: true })
        .pipe(concat('concatenated.js'))
        .pipe(gulp.dest('tmp'));
}

function babelfyJS(dev) {
    return function babelfy() {
        let pipeline = gulp.src('tmp/concatenated.js', { allowEmpty: true })
            .pipe(babel({
                presets: ['@babel/env'],
                comments: dev,
            }));
        if (dev) {
            console.log("DEV = ", dev)
            pipeline = pipeline
                .pipe(rename('script.min.js'))
                .pipe(gulp.dest('dist'))
        } else {
            console.log("!DEV = ", !dev)
            pipeline = pipeline
                .pipe(rename("babelfied.js"))
                .pipe(gulp.dest('tmp'))
        }
        return pipeline;
    }
}

function uglifyJS() {
    return gulp.src('tmp/babelfied.js', { allowEmpty: true })
        .pipe(uglify())
        .pipe(rename('script.min.js'))
        .pipe(gulp.dest('dist'))
}

function transpileSASS() {
    return gulp.src(['**/*.scss', '!node_modules/**', '!*.scss'], { allowEmpty: true })
        .pipe(sass.sync({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('tmp'));
}

function concatenateCSS() {
    return gulp.src(['**/*.css', '!node_modules/**', '!*.css'], { allowEmpty: true })
        .pipe(concatCss("concatenated.css", { rebaseUrls: false, }))
        .pipe(gulp.dest('tmp'));
}

function uglifyCSS() {
    return gulp.src('tmp/concatenated.css', { allowEmpty: true })
        .pipe(cleanCSS())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('dist'));
}

function minifyHTML() {
    return gulp.src('index.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(rename('html.min.html'))
        .pipe(gulp.dest('dist'));
}

function makeIndex() {
    return gulp.src('dist/html.min.html')
        .pipe(replace("</head>", `<link rel="stylesheet" href="./style.min.css" /></head>`))
        .pipe(replace("</body>", `<script src="./script.min.js"></script></body>`))
        .pipe(rename("index.html"))
        .pipe(gulp.dest('dist'));
}

function copyImages() {
    return gulp.src(['assets/images/**/*'], { allowEmpty: true })
        .pipe(gulp.dest('dist/images'));
}

function watch() {
    livereload.listen();
    gulp.watch([
        'assets/**',
        'index.html',
        '!dist'
    ], gulp.series('default'));
}

// gulp.task('watch', function () {
//     livereload.listen();
//     gulp.watch('!dist', ['default']);
// });

// Transpiles TS and stores it on tmp/transpiled
// Gets all JS on the document and concatenates it
// Babelfies the content 
// Uglifies the content
// Deletes the tmp file

exports.dev = series(
    clear(['tmp', 'dist/*']),
    parallel(
        series(transpileTS, concatenateJS, babelfyJS(true)),
        series(transpileSASS, concatenateCSS, uglifyCSS)
    ),
    parallel(
        series(
            minifyHTML, makeIndex
        ),
        copyImages
    ),
    clear('tmp'),
);

exports.prod = series(
    clear(['tmp', 'dist/*']),
    parallel(
        series(transpileTS, concatenateJS, babelfyJS(false), uglifyJS),
        series(transpileSASS, concatenateCSS, uglifyCSS)
    ),
    parallel(
        series(
            minifyHTML, makeIndex
        ),
        copyImages
    ),
    clear('tmp'),
);
exports.default = exports.prod;
exports.watch = series(watch);