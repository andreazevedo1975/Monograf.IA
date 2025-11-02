import React, { useState, useCallback, useRef } from 'react';
import { Project, Section, SectionType, FinalReview } from './types';
import { conductFinalReview, generateText, generateImage } from './services/geminiService';
import { BrainIcon, WandIcon, DocumentTextIcon, XCircleIcon, LightBulbIcon, BookOpenIcon, AcademicCapIcon, SunIcon, MoonIcon, PhotographIcon, UploadIcon } from './components/icons';

const initialProject: Project = {
    id: '1',
    title: '',
    author: '',
    template: 'Monografia',
    sections: [
        { id: 's1', title: 'Capa', content: '<h2>[Seu Nome Completo]</h2><h1>[Título do Trabalho]</h1><p>[Cidade]</p><p>[Ano]</p>', type: SectionType.PRE_TEXTUAL },
        { id: 's2', title: 'Resumo', content: '<p>Escreva aqui o resumo do seu trabalho...</p>', type: SectionType.PRE_TEXTUAL },
        { id: 's3', title: 'Introdução', content: '<p>A introdução do trabalho aborda o contexto do tema...</p>', type: SectionType.TEXTUAL },
        { id: 's4', title: 'Desenvolvimento', content: '<p>O desenvolvimento aprofunda os conceitos, análises e resultados...</p>', type: SectionType.TEXTUAL },
        { id: 's5', title: 'Conclusão', content: '<p>A conclusão resume os principais pontos e sugere futuras pesquisas...</p>', type: SectionType.TEXTUAL },
        { id: 's6', title: 'Referências', content: '<p>Insira aqui suas referências bibliográficas...</p>', type: SectionType.POST_TEXTUAL },
    ],
};

const App: React.FC = () => {
    const [project, setProject] = useState<Project>(initialProject);
    const [activeSectionId, setActiveSectionId] = useState<string>(project.sections[2].id);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [finalReview, setFinalReview] = useState<FinalReview | null>(null);
    const [imagePrompt, setImagePrompt] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeSection = project.sections.find(s => s.id === activeSectionId)!;

    const handleProjectMetaChange = (field: 'title' | 'author', value: string) => {
        setProject(prev => ({ ...prev, [field]: value }));
    };

    const handleSectionContentChange = (content: string) => {
        setProject(prevProject => ({
            ...prevProject,
            sections: prevProject.sections.map(s => s.id === activeSectionId ? { ...s, content } : s),
        }));
    };
    
    const insertHtmlAtEnd = (html: string) => {
        if (editorRef.current) {
            const currentContent = editorRef.current.innerHTML;
            const newContent = currentContent + html;
            handleSectionContentChange(newContent);
        }
    };

    const handleInsertImage = (imageDataUrl: string) => {
        const figureCount = (activeSection.content.match(/<figure/g) || []).length + 1;
        const imageHtml = `
            <figure class="my-4 text-center" contenteditable="false">
                <img src="${imageDataUrl}" alt="Imagem ${figureCount}" class="max-w-md h-auto mx-auto rounded-md border border-gray-300 dark:border-gray-600" />
                <figcaption class="mt-2 text-sm text-gray-600 dark:text-gray-400" contenteditable="true">
                    Figura ${figureCount} - Descreva a imagem aqui.
                    <br />
                    Fonte: O autor (${new Date().getFullYear()}).
                </figcaption>
            </figure>
            <p><br></p>`; // Add a new paragraph to continue writing
        insertHtmlAtEnd(imageHtml);
    };

    const handleFinalReview = useCallback(async () => {
        setIsLoading(true);
        setLoadingAction('review');
        setFinalReview(null);
        const fullText = project.sections
            .filter(s => s.type === SectionType.TEXTUAL)
            .map(s => `<h2>${s.title}</h2>${s.content}`)
            .join('<hr>');
        
        const review = await conductFinalReview(fullText.replace(/<[^>]*>?/gm, ' ')); // Strip HTML for analysis
        setFinalReview(review);
        setIsLoading(false);
        setLoadingAction(null);
    }, [project]);
    
    const handleGenerateText = useCallback(async () => {
        if (!project.title) {
            alert("Por favor, defina um título para o trabalho antes de gerar texto.");
            return;
        }
        setIsLoading(true);
        setLoadingAction('text');
        const plainTextContent = activeSection.content.replace(/<[^>]*>?/gm, ' ');
        const prompt = `Você é um assistente de escrita acadêmica. Continue o seguinte trecho da seção "${activeSection.title}" de um TCC sobre "${project.title}". Mantenha um tom formal e focado no tema. Retorne apenas o novo texto, sem repetir o que foi enviado.\n\nTrecho atual:\n${plainTextContent}`;
        const newText = await generateText(prompt);
        insertHtmlAtEnd(`<p>${newText.replace(/\n/g, '</p><p>')}</p>`);
        setIsLoading(false);
        setLoadingAction(null);
    }, [activeSection, project.title]);

    const handleGenerateImage = useCallback(async () => {
        if (!imagePrompt) {
            alert("Por favor, descreva a imagem que você deseja gerar.");
            return;
        }
        setIsLoading(true);
        setLoadingAction('image');
        const fullPrompt = `Estilo de ilustração conceitual para um trabalho acadêmico. ${imagePrompt}`;
        const imageData = await generateImage(fullPrompt);
        if (imageData) {
            handleInsertImage(`data:image/png;base64,${imageData}`);
        }
        setIsLoading(false);
        setLoadingAction(null);
    }, [imagePrompt]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    handleInsertImage(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-sans">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">
                    <div className="h-16 flex items-center justify-between px-4 border-b dark:border-gray-700">
                        <div className="flex items-center">
                           <AcademicCapIcon className="h-8 w-8 text-indigo-500" />
                           <h1 className="ml-2 text-lg font-bold">Monograf.IA</h1>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estrutura</h2>
                        <ul>
                            {project.sections.map(section => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => setActiveSectionId(section.id)}
                                        className={`w-full text-left flex items-center px-3 py-2 rounded-md text-sm font-medium ${activeSectionId === section.id ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        <DocumentTextIcon className="h-5 w-5 mr-3" />
                                        {section.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
                
                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
                        <div className="flex-1">
                             <input type="text" value={project.title} onChange={e => handleProjectMetaChange('title', e.target.value)} placeholder="Título do Trabalho" className="text-xl font-semibold bg-transparent w-full focus:outline-none focus:ring-0 border-none p-0"/>
                             <input type="text" value={project.author} onChange={e => handleProjectMetaChange('author', e.target.value)} placeholder="Nome do Autor" className="text-sm text-gray-500 bg-transparent w-full focus:outline-none focus:ring-0 border-none p-0"/>
                        </div>
                        <button onClick={handleFinalReview} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-4 flex-shrink-0">
                            <BrainIcon className="h-5 w-5" />
                            {loadingAction === 'review' ? 'Revisando...' : 'Revisão Final'}
                        </button>
                    </header>
                    <div className="flex-1 flex overflow-hidden">
                      <div className="flex-1 p-6 overflow-y-auto">
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-full">
                              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                 <BookOpenIcon className="h-6 w-6"/>
                                 {activeSection.title}
                              </h3>
                              <div
                                  key={activeSection.id}
                                  ref={editorRef}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onInput={(e) => handleSectionContentChange(e.currentTarget.innerHTML)}
                                  className="prose dark:prose-invert max-w-none w-full min-h-[60vh] p-4 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  dangerouslySetInnerHTML={{ __html: activeSection.content }}
                              />
                          </div>
                      </div>

                       {/* Right Tools Panel */}
                      <aside className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 border-l dark:border-gray-700 p-4 overflow-y-auto">
                           <h3 className="text-lg font-semibold mb-4">Assistente de Escrita</h3>
                           <div className="space-y-6">
                                <div>
                                    <button onClick={handleGenerateText} disabled={isLoading || !project.title} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
                                          <WandIcon className="h-4 w-4" />
                                          {loadingAction === 'text' ? 'Gerando...' : 'Continuar Escrita'}
                                    </button>
                                </div>

                                <div className="border-t dark:border-gray-700 pt-4">
                                     <h4 className="font-semibold mb-2">Imagens e Mídias</h4>
                                      <div className="space-y-4">
                                         <div>
                                            <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} rows={3} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm" placeholder="Descreva a imagem que você quer criar..."></textarea>
                                            <button onClick={handleGenerateImage} disabled={isLoading} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                                <PhotographIcon className="h-5 w-5" />
                                                {loadingAction === 'image' ? 'Criando...' : 'Criar Imagem'}
                                            </button>
                                        </div>
                                         <div className="text-center text-xs text-gray-500">OU</div>
                                        <div>
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept="image/*" className="hidden"/>
                                            <button onClick={handleUploadClick} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                                <UploadIcon className="h-5 w-5" />
                                                Fazer Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>
                           </div>
                      </aside>
                    </div>
                </main>
            </div>
            {finalReview && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setFinalReview(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold flex items-center gap-2"><BrainIcon className="h-6 w-6"/> Resultado da Revisão Final</h3>
                          <button onClick={() => setFinalReview(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XCircleIcon className="h-6 w-6"/></button>
                        </div>
                        <div>
                            <h4 className="font-bold mt-4 mb-2 text-red-600 dark:text-red-400">Feedback (Crítica Fria)</h4>
                            <div className="space-y-3 text-sm p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded">
                                <p><strong className="flex items-center"><XCircleIcon className="h-5 w-5 inline mr-2 text-red-500 flex-shrink-0" />Conformidade ABNT:</strong><span className="ml-2">{finalReview.feedback.abntCompliance}</span></p>
                                <p><strong className="flex items-center"><XCircleIcon className="h-5 w-5 inline mr-2 text-red-500 flex-shrink-0" />Originalidade:</strong><span className="ml-2">{finalReview.feedback.originality}</span></p>
                                <p><strong className="flex items-center"><XCircleIcon className="h-5 w-5 inline mr-2 text-red-500 flex-shrink-0" />Coesão:</strong><span className="ml-2">{finalReview.feedback.cohesion}</span></p>
                                <p><strong className="flex items-center"><XCircleIcon className="h-5 w-5 inline mr-2 text-red-500 flex-shrink-0" />Gramática:</strong><span className="ml-2">{finalReview.feedback.grammar}</span></p>
                            </div>

                            <h4 className="font-bold mt-6 mb-2 text-green-600 dark:text-green-400">Sugestões de Melhoria (Conselho de Mestre)</h4>
                            <div className="space-y-3 text-sm p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded">
                               <p><strong className="flex items-center"><LightBulbIcon className="h-5 w-5 inline mr-2 text-green-500 flex-shrink-0"/>Clareza:</strong><span className="ml-2">{finalReview.suggestions.clarity}</span></p>
                               <p><strong className="flex items-center"><LightBulbIcon className="h-5 w-5 inline mr-2 text-green-500 flex-shrink-0"/>Profundidade:</strong><span className="ml-2">{finalReview.suggestions.depth}</span></p>
                               <p><strong className="flex items-center"><LightBulbIcon className="h-5 w-5 inline mr-2 text-green-500 flex-shrink-0"/>Conclusão:</strong><span className="ml-2">{finalReview.suggestions.conclusion}</span></p>
                               <p><strong className="flex items-center"><LightBulbIcon className="h-5 w-5 inline mr-2 text-green-500 flex-shrink-0"/>Apresentação dos Resultados:</strong><span className="ml-2">{finalReview.suggestions.resultsPresentation}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;