{
  "targets": [
    {
      "target_name": "internal_module",
      "sources": [ "main.cpp","lodepng.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}