"use client";
import { useState } from 'react';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import IngredientInput from '../../../components/IngredientInput';
import RecipeFilters from '../../../components/RecipeFilters';
import RecipeResultCard from '../../../components/RecipeResultCard';
import { getRecipesByIngredients } from '../../../lib/recipesApi';
import { getMapsSearchUrl } from '../../../lib/mapsApi';
import jsPDF from 'jspdf';

export default function WhatCanICookPage() {
  const [ingredients, setIngredients] = useState([]);
  const [filters, setFilters] = useState({ cuisine: 'Any', diet: 'Any', time: '', maxIngredients: '' });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getRecipesByIngredients(ingredients, filters);
      setRecipes(res);
    } catch (e) {
      setError('Failed to fetch recipes.');
    }
    setLoading(false);
  };

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handlePrintRecipe = () => {
    if (selectedRecipe) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedRecipe.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              h2 { color: #666; margin-top: 20px; }
              img { max-width: 300px; height: auto; }
              ul { margin-left: 20px; }
              .instructions { white-space: pre-line; }
            </style>
          </head>
          <body>
            <h1>${selectedRecipe.title}</h1>
            <img src="${selectedRecipe.image}" alt="${selectedRecipe.title}" />
            <h2>Ingredients:</h2>
            <ul>
              ${selectedRecipe.ingredients ? selectedRecipe.ingredients.map(ing => `<li>${ing}</li>`).join('') : '<li>Ingredients not available</li>'}
            </ul>
            <h2>Instructions:</h2>
            <div class="instructions">${selectedRecipe.instructions || 'Instructions not available'}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadRecipe = () => {
    if (selectedRecipe) {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedRecipe.title, 20, 30);
      
      // Ingredients section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ingredients:', 20, 50);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yPosition = 60;
      
      if (selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0) {
        selectedRecipe.ingredients.forEach((ingredient, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${ingredient}`, 25, yPosition);
          yPosition += 8;
        });
      } else {
        doc.text('Ingredients not available', 25, yPosition);
      }
      
      // Instructions section
      yPosition += 15;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Instructions:', 20, yPosition);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
      
      if (selectedRecipe.instructions) {
        const instructions = selectedRecipe.instructions;
        const splitInstructions = doc.splitTextToSize(instructions, 170);
        
        splitInstructions.forEach((line) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 8;
        });
      } else {
        doc.text('Instructions not available', 20, yPosition);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Recipe from Nuti App', 20, doc.internal.pageSize.height - 20);
      
      // Download the PDF
      const filename = `${selectedRecipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;
      doc.save(filename);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }} className="min-h-screen">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="pt-20 relative transition-all duration-300 ease-in-out">
        <Sidebar open={sidebarOpen} />
        <main className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-0'} flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]`}>
          <div className="container mx-auto mt-10 p-4 sm:p-6 md:p-10 bg-white rounded-2xl shadow-lg w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Recipe Discovery</h1>
            <p className="text-md text-gray-500 text-center mb-5 opacity-70 italic">Find Recipes with Your Ingredients</p>
            
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />
              <RecipeFilters filters={filters} setFilters={setFilters} />
              <button
                onClick={handleSearch}
                className="mt-4 px-8 py-3 mt-10 rounded bg-[var(--primary)] text-[var(--text-light)] font-semibold hover:opacity-90 transition"
                disabled={loading || ingredients.length === 0}
              >
                {loading ? 'Searching...' : 'Find Recipes'}
              </button>
              {error && <p className="text-red-500 mt-2 font-semibold">{error}</p>}
            </div>

            <div className="mt-8">
              {recipes.length === 0 && !loading && (
                <div className="text-center text-gray-400">
                  <p className="text-lg">No recipes yet. Add ingredients and search!</p>
                </div>
              )}
              {recipes.map(recipe => (
                <div key={recipe.id} className="mb-6">
                  <RecipeResultCard recipe={recipe} onViewRecipe={handleViewRecipe} />
                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <div className="ml-4 p-4 bg-white rounded-3xl shadow-lg border border-[#EECFD4] hover:shadow-xl transition-shadow">
                      <span className="text-ml font-semibold text-[#B48C8C] block mb-3">🔍 Find missing ingredients nearby:</span>
                      <ul className="list-disc list-inside space-y-2">
                        {recipe.missingIngredients.map(ing => (
                          <li key={ing}>
                            <a href={getMapsSearchUrl(ing)} target="_blank" rel="noopener noreferrer" className="text-[#3B3B3B] hover:text-[#B48C8C] underline transition-colors font-medium">{ing}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      
      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
                <button 
                  onClick={() => setShowRecipeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-48 object-cover rounded-lg mb-4" />
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handlePrintRecipe}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                >
                  🖨️ Print Recipe
                </button>
                <button
                  onClick={handleDownloadRecipe}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                >
                  📥 Download Recipe
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">Ingredients:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                    selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-gray-700">{ingredient}</li>
                    ))
                  ) : (
                    <li className="text-gray-500">Ingredients not available</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">Instructions:</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {selectedRecipe.instructions || 'Instructions not available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 