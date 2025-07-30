import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads the SVG logo file and converts it to a Base64 data URI
 * @returns {string} Base64 encoded data URI of the logo
 */
export const getLogoAsBase64 = () => {
  try {
    // Path to the logo SVG file
    const logoPath = path.resolve('..', 'frontend', 'src', 'assets', 'logo.svg');
    
    // Read the SVG file
    const svgContent = fs.readFileSync(logoPath, 'utf8');
    
    // Convert to Base64
    const base64Logo = Buffer.from(svgContent).toString('base64');
    
    // Return as data URI
    return `data:image/svg+xml;base64,${base64Logo}`;
  } catch (error) {
    console.error('Error reading logo file:', error);
    // Return null if there's an error, so templates can use a fallback
    return null;
  }
};

/**
 * Updates MJML template with embedded logo
 * @param {string} mjmlTemplate - The MJML template string
 * @returns {string} - MJML template with embedded logo
 */
export const embedLogoInTemplate = (mjmlTemplate) => {
  const logoBase64 = getLogoAsBase64();
  
  // If logo was successfully converted to Base64, embed it in the template
  if (logoBase64) {
    // Replace the placeholder URL with the data URI
    return mjmlTemplate.replace(
      'src="https://raw.githubusercontent.com/user/repo/main/prescripto-logo.png"',
      `src="${logoBase64}"`
    );
  }
  
  // If there was an error, return the original template (which uses a placeholder)
  return mjmlTemplate;
};

export default {
  getLogoAsBase64,
  embedLogoInTemplate
}; 