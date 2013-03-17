{
    "targets": [{
        "target_name"   : "size"
      , "include_dirs"  : [
            "<@(leveldown_include_dirs)"
        ]
      , "link_settings" : {
            "libraries": [
                "<@(leveldown_libraries)"
            ]
        }
      , "sources"       : [
            "src/size.cc"
        ]
      , 'conditions'    : [
            ['OS == "linux"', {
                'ccflags': [
                    '-fPIC'
                ]
            }]
          , ['OS == "solaris"', {
                'ccflags': [
                    '-fPIC'
                ]
            }]
          , ['OS == "mac"', {
                'ccflags': [
                    '-fPIC'
                ]
            }]
        ]
    }]
}
