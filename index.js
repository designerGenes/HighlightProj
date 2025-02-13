const highlight = require('highlight.js');
const app = require('express')();

const fs = require('fs');
const path = require('path');

const codeExample = `class DataProcessor {
    constructor(data) {
        this.data = data;
        this.processed = false;
    }

    async processData() {
        try {
            const result = await Promise.all(
                this.data.map(item => this.transform(item))
            );
            this.processed = true;
            return result;
        } catch (error) {
            console.error(\`Error processing data: \${error.message}\`);
            throw new Error('Processing failed');
        }
    }

    transform(item) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(item * 2);
            }, 100);
        });
    }
}

const processor = new DataProcessor([1, 2, 3, 4]);
processor.processData().then(console.log);`;

function getThemeCSS(theme) {
    return fs.readFileSync(
        path.join(__dirname, 'node_modules', 'highlight.js', 'styles', `${theme}.css`),
        'utf-8'
    );
}

app.get('/', (req, res) => {
    const themes = fs.readdirSync(path.join(__dirname, 'node_modules', 'highlight.js', 'styles'))
        .filter(file => file.endsWith('.css'))
        .map(file => file.replace(/\.min\.css$|\.css$/, ''))
        .filter((theme, index, self) => self.indexOf(theme) === index);

    // Categorize themes
    const lightThemes = themes.filter(theme => 
        /light|lite|bright|white/i.test(theme));
    const darkThemes = themes.filter(theme => 
        /dark|night|black/i.test(theme));
    const unknownThemes = themes.filter(theme => 
        !lightThemes.includes(theme) && !darkThemes.includes(theme));

    let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Highlight.js Themes</title>';
    
    // Add theme styles
    themes.forEach(theme => {
        let cssFile = `${theme}.min.css`;
        if (!fs.existsSync(path.join(__dirname, 'node_modules', 'highlight.js', 'styles', cssFile))) {
            cssFile = `${theme}.css`;
        }
        const css = fs.readFileSync(
            path.join(__dirname, 'node_modules', 'highlight.js', 'styles', cssFile),
            'utf-8'
        );
        html += `<style>.theme-${theme} { ${css} }</style>`;
    });
    
    html += '</head><body>';

    // Add theme categorization section
    html += '<h1>Theme Categories</h1>';
    html += '<h2>Light Themes</h2>';
    html += `<p id="lightThemesList">${lightThemes.join(', ')}</p>`;
    html += '<h2>Dark Themes</h2>';
    html += `<p id="darkThemesList">${darkThemes.join(', ')}</p>`;
    html += '<h2>Unknown Themes</h2>';
    html += `<p id="unknownThemesList">${unknownThemes.join(', ')}</p>`;
    
    // Add radio buttons for filtering
    html += `
    <div style="margin: 20px 0;">
        <label><input type="radio" name="themeFilter" value="light" checked> Light Themes</label>
        <label><input type="radio" name="themeFilter" value="dark"> Dark Themes</label>
        <label><input type="radio" name="themeFilter" value="unknown"> Unknown Themes</label>
    </div>
    <hr><br>`;

    // Theme demonstrations with category classes
    themes.forEach(theme => {
        const category = lightThemes.includes(theme) ? 'light' 
                      : darkThemes.includes(theme) ? 'dark' 
                      : 'unknown';
        
        html += `<div class="theme-demo ${category}-theme" style="display: none;" data-theme="${theme}">`;
        html += `<div style="display: flex; align-items: center; gap: 10px;">`;
        html += `<h2><strong>${theme}</strong></h2>`;
        html += `<button onclick="moveTheme('${theme}', 'light')">Light</button>`;
        html += `<button onclick="moveTheme('${theme}', 'dark')">Dark</button>`;
        html += `</div>`;
        html += `<div class="theme-${theme}">`;
        html += `<pre><code class="hljs" style="display: block; padding: 1em;">${highlight.highlightAuto(codeExample).value}</code></pre>`;
        html += '</div><br><br></div>';
    });

    // Add JavaScript for filtering and moving themes
    html += `
    <script>
        // Initialize theme categories in session storage if not exists
        if (!sessionStorage.getItem('themeCategories')) {
            sessionStorage.setItem('themeCategories', JSON.stringify({
                light: ${JSON.stringify(lightThemes)},
                dark: ${JSON.stringify(darkThemes)},
                unknown: ${JSON.stringify(unknownThemes)}
            }));
        }

        function getThemeCategories() {
            return JSON.parse(sessionStorage.getItem('themeCategories'));
        }

        function moveTheme(themeName, toCategory) {
            const categories = getThemeCategories();
            // Remove from all categories
            ['light', 'dark', 'unknown'].forEach(cat => {
                categories[cat] = categories[cat].filter(t => t !== themeName);
            });
            // Add to new category
            categories[toCategory].push(themeName);
            sessionStorage.setItem('themeCategories', JSON.stringify(categories));
            
            // Update displayed lists
            updateCategoryLists();
            // Refresh visible themes
            filterThemes(document.querySelector('input[name="themeFilter"]:checked').value);
        }

        function updateCategoryLists() {
            const categories = getThemeCategories();
            document.getElementById('lightThemesList').textContent = categories.light.join(', ');
            document.getElementById('darkThemesList').textContent = categories.dark.join(', ');
            document.getElementById('unknownThemesList').textContent = categories.unknown.join(', ');
        }

        function filterThemes(category) {
            const categories = getThemeCategories();
            document.querySelectorAll('.theme-demo').forEach(demo => {
                const themeName = demo.getAttribute('data-theme');
                demo.style.display = categories[category].includes(themeName) ? 'block' : 'none';
            });
        }

        document.querySelectorAll('input[name="themeFilter"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                filterThemes(e.target.value);
            });
        });

        // Show light themes by default
        filterThemes('light');
    </script>`;

    html += '</body></html>';
    res.send(html);
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

