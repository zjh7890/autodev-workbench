import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

import { InstantiationService, providerContainer } from "../base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "../base/common/languages/languageService";
import { IStructurerProvider } from "../ProviderTypes";
import { JavaStructurerProvider } from "../code-context/java/JavaStructurerProvider";
import { TypeScriptStructurer } from "../code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "../code-context/go/GoStructurerProvider";
import { KotlinStructurerProvider } from "../code-context/kotlin/KotlinStructurerProvider";
import { CodeAnalyzer } from "./analyzers/CodeAnalyzer";
import { CodeAnalysisResult } from "./CodeAnalysisResult";
import { PythonStructurer } from "../code-context/python/PythonStructurer";
import { AppConfig, DEFAULT_CONFIG } from "../types/AppConfig";
import { RustStructurer } from "../code-context/rust/RustStructurer";
import { CStructurer } from "../code-context/c/CStructurer";
import { CSharpStructurer } from "../code-context/csharp/CSharpStructurer";

export class InterfaceAnalyzerApp {
    private instantiationService: InstantiationService;
    private codeAnalyzer: CodeAnalyzer;

    constructor() {
        this.instantiationService = new InstantiationService();
        this.instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider);

        providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
        providerContainer.bind(IStructurerProvider).to(KotlinStructurerProvider);
        providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
        providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);
        providerContainer.bind(IStructurerProvider).to(PythonStructurer);
        providerContainer.bind(IStructurerProvider).to(RustStructurer);
        providerContainer.bind(IStructurerProvider).to(CStructurer);
        providerContainer.bind(IStructurerProvider).to(CSharpStructurer);

        // 使用默认配置初始化CodeAnalyzer
        this.codeAnalyzer = new CodeAnalyzer(this.instantiationService, DEFAULT_CONFIG);
    }

    public async uploadResult(result: CodeAnalysisResult, config: AppConfig): Promise<void> {
        try {
            const textResult = await this.codeAnalyzer.convertToList(result);

            const debugFilePath = path.join(process.cwd(), 'debug_analysis_result.json');
            fs.writeFileSync(debugFilePath, JSON.stringify(textResult, null, 2));

            const response = await fetch(config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(textResult)
            });

            const data = await response.json();
            if (data.success) {
                console.log('分析结果上传成功!');
                console.log(`ID: ${data.id}`);
            } else {
                console.error('上传失败:', data);
            }
        } catch (error) {
            console.error('上传过程中发生错误:', error);
        }
    }

    public async run(config: AppConfig): Promise<void> {
        await this.codeAnalyzer.initialize();

        // 更新分析器配置
        this.codeAnalyzer.updateConfig(config);

        console.log(`正在扫描目录: ${config.dirPath}`);
        const result: CodeAnalysisResult = await this.codeAnalyzer.analyzeDirectory();

        // 使用配置中的输出文件名
        const outputFilePath = path.join(process.cwd(), config.outputJsonFile || 'analysis_result.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));

        if (config.upload) {
            console.log(`正在上传分析结果到 ${config.serverUrl}`);
            await this.uploadResult(result, config);
        }

        console.log(`分析结果已保存到 ${outputFilePath}`);
        await this.codeAnalyzer.generateLearningMaterials(result);
    }
}
