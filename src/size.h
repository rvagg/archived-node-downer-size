/* Copyright (c) 2013 Rod Vagg
 * MIT +no-false-attribs License <https://github.com/rvagg/node-downer-size/blob/master/LICENSE>
 */

#ifndef DRD_ITERATOR_H
#define DRD_ITERATOR_H

#include <node.h>
#include <node_buffer.h>
#include <database.h>
#include <async.h>

LD_SYMBOL ( option_start   , start   );
LD_SYMBOL ( option_end     , end     );

class SizeWorker : public leveldown::AsyncWorker {
public:
  SizeWorker (
      leveldown::Database* database
    , v8::Persistent<v8::Function> callback
    , leveldb::Slice* start
    , std::string* end
    , v8::Persistent<v8::Value> startPtr
  );
  virtual ~SizeWorker ();
  virtual void Execute ();
  virtual void HandleOKCallback ();

private:
  leveldb::Slice* start;
  std::string* end;
  v8::Persistent<v8::Value> startPtr;
  int size;
};

#endif
