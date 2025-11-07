cmake_minimum_required(VERSION 3.13)

set(CMAKE_EXPORT_COMPILE_COMMANDS TRUE)
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)

project(wbxml C)

include(ExternalProject)

ExternalProject_Add(libexpat
	GIT_REPOSITORY https://github.com/libexpat/libexpat
	GIT_TAG 4575e52f83e0d6d7bd24939eab8952bbc7bc358f
	SOURCE_DIR ${CMAKE_BINARY_DIR}/libexpat-src
	BINARY_DIR ${CMAKE_BINARY_DIR}/libexpat-build
    CMAKE_COMMAND emcmake cmake
	CMAKE_ARGS
		-DCMAKE_BUILD_TYPE=Release
		-DEXPAT_BUILD_TESTS=OFF
		-DBUILD_STATIC_LIBS=ON
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
    CMAKE_COMMAND emcmake cmake
	CMAKE_ARGS
		-DCMAKE_BUILD_TYPE=Release
		-DBUILD_STATIC_LIBS=ON
		-DCMAKE_PREFIX_PATH=${CMAKE_BINARY_DIR}/root
		-DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/root
)

add_executable(wbxml src/main.c)
target_include_directories(wbxml PRIVATE ${CMAKE_BINARY_DIR}/root/include/libwbxml-1.1)
target_link_options(wbxml PRIVATE -L${CMAKE_BINARY_DIR}/root/lib)
target_link_libraries(wbxml PRIVATE -lwbxml2 -lexpat)
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
