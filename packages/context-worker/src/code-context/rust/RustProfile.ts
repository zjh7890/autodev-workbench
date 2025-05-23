import { injectable } from 'inversify';

import rust from '../../code-search/schemas/indexes/rust.scm';
import { ILanguageServiceProvider } from '../../base/common/languages/languageService';
import { LanguageProfile, MemoizedQuery } from '../base/LanguageProfile';

@injectable()
export class RustProfile implements LanguageProfile {
	languageIds = ['rust'];
	fileExtensions = ['rs'];
	grammar = (langService: ILanguageServiceProvider) => langService.getLanguage('rust');
	isTestFile = (filePath: string) => filePath.endsWith('test.rs');
	scopeQuery = new MemoizedQuery(rust);
	hoverableQuery = new MemoizedQuery(`
     [(identifier)
         (shorthand_field_identifier)
         (field_identifier)
         (type_identifier)] @hoverable
  `);
	classQuery = new MemoizedQuery(`
		(struct_item (type_identifier) @type_identifier) @type_declaration
    `);
	methodQuery = new MemoizedQuery(`
			(function_item (identifier) @name.definition.method) @definition.method
    `);
	blockCommentQuery = new MemoizedQuery(`
		(block_comment) @docComment
	`);
	methodIOQuery = new MemoizedQuery(`
		(function_item
      name: (identifier) @function.identifier
      return_type: (type_identifier)? @method-returnType
		) @function
	`);
	structureQuery = new MemoizedQuery(`
		(use_declaration 
       argument: (scoped_use_list
			   path: (scoped_identifier) @use-path)
    )?

		(struct_item
			name: (type_identifier) @struct-name
			body: [
				(field_declaration_list
					(field_declaration
						name: (field_identifier) @struct-field-name
						type: (_) @struct-field-type)?
				)?
				(ordered_field_declaration_list)?
			]
		)

		(trait_item
			name: (type_identifier) @trait-name
			body: (declaration_list
				(function_signature_item
					name: (identifier) @trait-method-name
					parameters: (parameters) @trait-method-params
					return_type: (_)? @trait-method-return-type
				)?
			)?
		)

		(impl_item
			trait: (type_identifier)? @impl-trait-name
			type: (type_identifier) @impl-struct-name
			body: (declaration_list
				(function_item
					name: (identifier) @impl-method-name
					parameters: (parameters) @impl-method-params
					return_type: (_)? @impl-method-returnType
					body: (_) @impl-method-body
				)?
			)?
		)

		(function_item
			name: (identifier) @function-name
			parameters: (parameters) @function-params
			return_type: (_)? @function-returnType
			body: (_) @function-body
		)

		(parameter
			pattern: (identifier) @param-name
			type: (_) @param-type
		)
	`);
	namespaces = [[
		// variables
		"const",
		"function",
		"variable",
		// types
		"struct",
		"enum",
		"union",
		"typedef",
		"interface",
		// fields
		"field",
		"enumerator",
		// namespacing
		"module",
		// misc
		"label",
		"lifetime",
	]];
	autoSelectInsideParent = [];
	builtInTypes = [
// 基本类型
		"bool",         // 对应 Java 的 boolean
		"i8",           // 对应 Java 的 byte
		"char",         // 对应 Java 的 char
		"i16",          // 对应 Java 的 short
		"i32",          // 对应 Java 的 int
		"i64",          // 对应 Java 的 long
		"f32",          // 对应 Java 的 float
		"f64",          // 对应 Java 的 double
		"()",           // 对应 Java 的 void

		// 包装类对应类型（Rust 没有直接的包装类型，但以下为常用的类型）
		"bool",         // 对应 Java 的 Boolean
		"i8",           // 对应 Java 的 Byte
		"char",         // 对应 Java 的 Character
		"i16",          // 对应 Java 的 Short
		"i32",          // 对应 Java 的 Integer
		"i64",          // 对应 Java 的 Long
		"f32",          // 对应 Java 的 Float
		"f64",          // 对应 Java 的 Double
		"String",       // 对应 Java 的 String

		// 集合类型（Rust 没有直接对应的类型名，但以下为常用的集合类型）
		"&[T]",         // 对应 Java 的 Array，Rust 中的 slice 引用
		"Vec<T>",       // 对应 Java 的 List，Rust 中的动态数组
		"HashMap<K, V>",// 对应 Java 的 Map，Rust 中的哈希映射
		"HashSet<T>",   // 对应 Java 的 Set，Rust 中的哈希集合
		"Vec<T>",       // 对应 Java 的 Collection，Rust 中可用 Vec 代表
		"impl Iterator",// 对应 Java 的 Iterable 和 Iterator，Rust 中的 Iterator trait
		"impl Iterator",// 对应 Java 的 Stream，Rust 中流式处理可以用 Iterator 实现
		"Option<T>",    // 对应 Java 的 Optional，Rust 中的 Option 类型
	];
}
