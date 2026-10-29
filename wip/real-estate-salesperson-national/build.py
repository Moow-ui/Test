import sys; sys.path.insert(0,'..')
import qlib, lib_common
for f in ['q1','q2','q3','q4','q5']: __import__(f)
SUB={'property-characteristics':'property-land-use','land-use-controls':'property-land-use','ownership-estates':'ownership-title','deeds-title-recording':'ownership-title','value-appraisal':'valuation','contracts':'contracts-agency','agency':'contracts-agency','brokerage-practice':'practice','fair-housing':'practice','disclosures-environmental':'disclosures','financing-settlement':'financing','real-estate-math':'math'}
rows=lib_common.make('real-estate-salesperson-national',SUB.get,"**Wrong choices**",qlib.OUT,seed=20261030)
lib_common.emit(rows,'.')
