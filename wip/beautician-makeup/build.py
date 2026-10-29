import sys; sys.path.insert(0,'..')
import qlib, lib_common
for f in ['k1','k2','k3','k4','k5']: __import__(f)
rows=lib_common.make('beautician-makeup',lambda c:'written',"**틀린 선지**",qlib.OUT,seed=20261030)
lib_common.emit(rows,'.')
