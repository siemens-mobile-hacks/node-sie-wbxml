cmake_minimum_required(VERSION 3.13)

set(CMAKE_EXPORT_COMPILE_COMMANDS TRUE)
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)

project(wbxml C)

include(ExternalProject)

ExternalProject_Add(libexpat
	GIT_REPOSITORY https://github.com/libexpat/libexpat
	GIT_TAG a70841d9ffa64ddde29ab824ed6305035ebe4c47 # R_2_10_0
	SOURCE_DIR ${CMAKE_BINARY_DIR}/libexpat-src
	BINARY_DIR ${CMAKE_BINARY_DIR}/libexpat-build
	CMAKE_COMMAND emcmake cmake
	CMAKE_ARGS
		-DCMAKE_BUILD_TYPE=Release
		-DEXPAT_BUILD_TESTS=OFF
		-DEXPAT_BUILD_TOOLS=OFF
		-DEXPAT_BUILD_EXAMPLES=OFF
		-DEXPAT_BUILD_DOCS=OFF
		-DEXPAT_SHARED_LIBS=OFF
		-DCMAKE_PREFIX_PATH=${CMAKE_BINARY_DIR}/root
		-DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/root
	SOURCE_SUBDIR expat
)

ExternalProject_Add(libwbxml
	DEPENDS libexpat
	GIT_REPOSITORY https://github.com/libwbxml/libwbxml
	GIT_TAG ebeb80d6f3ded9a951f1d28229368db8edf05df7
	SOURCE_DIR ${CMAKE_BINARY_DIR}/libwbxml-src
	BINARY_DIR ${CMAKE_BINARY_DIR}/libwbxml-build
	# Fix stack overflow (recursion over siblings) and O(n^2) node insertion on large documents.
	# Make iconv work: wbxml_charset.c never saw HAVE_ICONV and passed 32-bit lengths as size_t *.
	PATCH_COMMAND git reset --hard -q
		COMMAND git apply ${CMAKE_SOURCE_DIR}/patches/libwbxml-large-documents.patch
		COMMAND git apply ${CMAKE_SOURCE_DIR}/patches/libwbxml-iconv.patch
	CMAKE_COMMAND emcmake cmake
	CMAKE_ARGS
		-DCMAKE_BUILD_TYPE=Release
		-DBUILD_SHARED_LIBS=OFF
		-DBUILD_STATIC_LIBS=ON
		-DCMAKE_PREFIX_PATH=${CMAKE_BINARY_DIR}/root
		-DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/root
)

add_executable(wbxml src/main.c)
add_dependencies(wbxml libwbxml)
target_include_directories(wbxml PRIVATE ${CMAKE_BINARY_DIR}/root/include/libwbxml-1.1)
target_link_libraries(wbxml PRIVATE
	${CMAKE_BINARY_DIR}/root/lib/libwbxml2.a
	${CMAKE_BINARY_DIR}/root/lib/libexpat.a
)
target_link_options(wbxml PRIVATE
	-sWASM=1
	-sSTRICT=1
	-sEXPORT_ES6=1
	-sDYNAMIC_EXECUTION=0
	-sMODULARIZE
	-sINVOKE_RUN=0
	-sSINGLE_FILE=0
	-sASSERTIONS=1
	-sEXIT_RUNTIME=1
	-sFILESYSTEM=1
	-sSTACK_OVERFLOW_CHECK=0
	-sSTACK_SIZE=1MB
	-sALLOW_MEMORY_GROWTH
	-sENVIRONMENT=node,web,worker
	-sMALLOC=emmalloc
	-sEXPORTED_FUNCTIONS=['_malloc','_free','_xml2wbxml','_wbxml2xml']
	-sEXPORTED_RUNTIME_METHODS=['cwrap','wasmMemory','HEAPU8','HEAPU32']
)
target_link_options(wbxml PRIVATE
	--emit-tsd "$<TARGET_FILE_DIR:wbxml>/wbxml.d.ts"
)
target_compile_options(wbxml PRIVATE -Oz)
