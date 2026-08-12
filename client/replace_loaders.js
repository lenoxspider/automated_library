const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(baseDir, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. health/page.tsx
    if (filePath.includes('health') && filePath.endsWith('page.tsx')) {
      content = content.replace(
        /<div className="flex justify-center items-center h-64">\s*<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"><\/div>\s*<\/div>/g,
        '<LoadingSpinner />'
      );
    }

    // 2. Simple divs/ps with Loading...
    content = content.replace(
      /<p className="[^"]*">Loading(\.\.\.| [a-z\.]+)?<\/p>/g,
      '<LoadingSpinner />'
    );
    content = content.replace(
      /<div className="[^"]*">Loading(\.\.\.| [a-z\.]+)?<\/div>/g,
      '<LoadingSpinner />'
    );
    content = content.replace(
      /<div>Loading(\.\.\.| [a-z\.]+)?<\/div>/g,
      '<LoadingSpinner />'
    );
    
    // table td loading
    content = content.replace(
      /<tr><td colSpan=\{\d+\} className="[^"]*">Loading(\.\.\.| [a-z\.]+)?<\/td><\/tr>/g,
      '<tr><td colSpan={4}><LoadingSpinner /></td></tr>'
    );

    if (content !== original) {
      // Need to add import
      // Determine relative path to src/components/ui/LoadingSpinner
      const relativeToSrc = path.relative(path.dirname(filePath), path.join(__dirname, 'src/components/ui/LoadingSpinner'));
      let importPath = relativeToSrc.replace(/\\/g, '/');
      if (!importPath.startsWith('.')) {
        importPath = './' + importPath;
      }
      
      const importStatement = `import LoadingSpinner from '${importPath}';\n`;
      if (!content.includes('import LoadingSpinner')) {
        // Insert after first import
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', firstImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
      }

      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
