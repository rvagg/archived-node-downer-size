/* Copyright (c) 2013 Rod Vagg
 * MIT +no-false-attribs License <https://github.com/rvagg/node-downer-size/blob/master/LICENSE>
 */

#include <node.h>
#include <node_buffer.h>
#include <leveldb/slice.h>
#include <leveldown.h>
#include <iterator.h>
#include "size.h"

#include <iostream>


/** SizeWorker, to do the actual delete work
  * extends from AsyncWorker in LevelDOWN, a lot of the dirty
  * async work is handled there.
  */
SizeWorker::SizeWorker (
    leveldown::Database* database
  , v8::Persistent<v8::Function> callback
  , leveldb::Slice* start
  , std::string* end
  , v8::Persistent<v8::Value> startPtr
) : leveldown::AsyncWorker(database, callback)
  , start(start)
  , end(end)
  , startPtr(startPtr)
{
};

SizeWorker::~SizeWorker () {
}

void SizeWorker::Execute () {
  leveldown::Iterator* iterator = new leveldown::Iterator(
      database
    , start
    , end
    , false // reverse
    , false  // keys
    , false // values
    , -1    // limit
    , false // fillCache
    , false // keyAsBuffer
    , false // valueAsBuffer
    , startPtr
  );

  // these next lines are the actual range-delete operation
  std::string key; // nah, not actually used
  size = 0;
  for (; iterator->IteratorNext(key, key); size++) {
    if (size % 10000 == 0) std::cout << "size: " << size << std::endl;
  }
  iterator->IteratorEnd();
}

/** The concrete implementation of the .rangeDel() method attached
  * to a LevelDOWN instance.
  * copied mostly from LevelDOWN iterator.cc Iterator::New()
  * because the functionality is very similar to making a new iterator
  */
v8::Handle<v8::Value> NewSize (const v8::Arguments& args) {
  v8::HandleScope scope;

  LD_METHOD_SETUP_COMMON(rangeDel, 0, 1)

  v8::Local<v8::Value> startBuffer;
  leveldb::Slice* start = NULL;
  std::string* end = NULL;

  if (!optionsObj.IsEmpty() && optionsObj->Has(option_start)
      && (node::Buffer::HasInstance(optionsObj->Get(option_start))
        || optionsObj->Get(option_start)->IsString())) {

    startBuffer = v8::Local<v8::Value>::New(optionsObj->Get(option_start));
    LD_STRING_OR_BUFFER_TO_SLICE(_start, startBuffer, Start)
    start = new leveldb::Slice(_start.data(), _start.size());
  }

  if (!optionsObj.IsEmpty() && optionsObj->Has(option_end)
      && (node::Buffer::HasInstance(optionsObj->Get(option_end))
        || optionsObj->Get(option_end)->IsString())) {

    v8::Local<v8::Value> endBuffer =
        v8::Local<v8::Value>::New(optionsObj->Get(option_end));
    LD_STRING_OR_BUFFER_TO_SLICE(_end, endBuffer, End)
    end = new std::string(_end.data(), _end.size());
  }

  SizeWorker* worker = new SizeWorker(
      database
    , callback
    , start
    , end
    , v8::Persistent<v8::Value>::New(startBuffer)
  );

  AsyncQueueWorker(worker);

  return v8::Undefined();
}

/** Our plugin that extends from the base Plugin class in LevelDOWN.
  * We just need a Name(), and an Init() that is run each time new LevelDOWN
  * instance is created.
  */
class SizePlugin : public leveldown::Plugin {
public:
  SizePlugin () {}

  const char* Name () {
    return "Downer Size";
  }

  void Init (v8::Local<v8::Object> database) {
    // given a LevelDOWN instance, attach a .rangeDel() method to it
    // using the implementation above
    database->Set(
        v8::String::NewSymbol("size")
      , v8::FunctionTemplate::New(NewSize)->GetFunction()
    );
  }

};

LD_PLUGIN(size, SizePlugin)
